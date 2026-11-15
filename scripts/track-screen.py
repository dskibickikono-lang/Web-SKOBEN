# Śledzenie ciemnego prostokąta (ekran + ramka laptopa) w kolejnych klatkach filmu.
# Wynik: cztery narożniki (TL, TR, BR, BL) w ułamkach kadru dla każdej klatki, wygładzone w czasie.
import sys, json
import numpy as np
from PIL import Image, ImageDraw

def load(path):
    return np.asarray(Image.open(path).convert('L')).astype(np.int16)

def run_end(vals, T, need=3):
    """Indeks pierwszego miejsca, w którym zaczyna się `need` jasnych pikseli z rzędu (koniec ciemnego przebiegu)."""
    bright = vals > T
    c = 0
    for i, b in enumerate(bright):
        c = c + 1 if b else 0
        if c >= need:
            return i - need + 1
    return len(vals)

def fit(xs, ys):
    """Odporna prosta ys = a*xs + b (dwa przebiegi z odrzuceniem odstających)."""
    xs = np.asarray(xs, float); ys = np.asarray(ys, float)
    keep = np.ones(len(xs), bool)
    for _ in range(3):
        a, b = np.polyfit(xs[keep], ys[keep], 1)
        r = np.abs(ys - (a * xs + b))
        lim = max(1.5, 2.5 * np.median(r[keep]))
        keep = r <= lim
        if keep.sum() < 6: break
    return a, b

def track(a, seed, T):
    h, w = a.shape
    cx, cy = int(seed[0]), int(seed[1])
    # zgrubny zasięg od ziarna
    up = cy - run_end(a[cy::-1, cx], T); down = cy + run_end(a[cy:, cx], T)
    left = cx - run_end(a[cy, cx::-1], T); right = cx + run_end(a[cy, cx:], T)
    H = down - up; W = right - left
    ys = np.arange(int(up + 0.18 * H), int(down - 0.18 * H))
    xs = np.arange(int(left + 0.18 * W), int(right - 0.18 * W))
    if len(ys) < 6 or len(xs) < 6: raise RuntimeError('blob too small')
    L = [cx - run_end(a[y, cx::-1], T) + 1 for y in ys]
    R = [cx + run_end(a[y, cx:], T) - 1 for y in ys]
    Tp = [cy - run_end(a[cy::-1, x], T) + 1 for x in xs]
    Bt = [cy + run_end(a[cy:, x], T) - 1 for x in xs]
    aL, bL = fit(ys, L); aR, bR = fit(ys, R)      # x = a*y + b
    aT, bT = fit(xs, Tp); aB, bB = fit(xs, Bt)    # y = a*x + b
    def cross(av, bv, ah, bh):  # x = av*y + bv ; y = ah*x + bh
        y = (ah * bv + bh) / (1 - ah * av); x = av * y + bv
        return x, y
    q = [cross(aL, bL, aT, bT), cross(aR, bR, aT, bT), cross(aR, bR, aB, bB), cross(aL, bL, aB, bB)]
    return np.array(q), (aL, bL, aR, bR)

def main(dirname, n_last, out, T=48):
    quads = []; lines = []
    a = load(f'{dirname}/f001.jpg'); h, w = a.shape
    # ziarno: najciemniejsze okno w dolnej, środkowej części kadru
    best = (1e9, None)
    for y in range(int(0.45 * h), int(0.92 * h), 6):
        for x in range(int(0.3 * w), int(0.7 * w), 6):
            m = a[y - 12:y + 12, x - 20:x + 20].mean()
            if m < best[0]: best = (m, (x, y))
    seed = best[1]
    for n in range(1, n_last + 1):
        a = load(f'{dirname}/f{n:03d}.jpg')
        q, ln = track(a, seed, T)
        quads.append(q); lines.append(ln)
        seed = q.mean(axis=0)
    Q = np.array(quads)                       # (N, 4, 2)
    # Dolna krawędź potrafi „wyciec” na klawiaturę. Pokrywa jest sztywnym prostokątem, więc jej proporcja
    # zmienia się płynnie: bierzemy górną obwiednię proporcji (wyciek tylko ją zaniża) i z niej liczymy dół.
    N = len(Q)
    Wt = Q[:, 1, 0] - Q[:, 0, 0]
    Hr = ((Q[:, 3, 1] - Q[:, 0, 1]) + (Q[:, 2, 1] - Q[:, 1, 1])) / 2
    r = Wt / Hr
    # odporna regresja: wyciek zaniża proporcję skokowo, więc iteracyjnie odrzucamy klatki wyraźnie poniżej trendu
    tt = np.arange(N); good = np.ones(N, bool)
    def smooth(mask):
        out = np.empty(N)
        for i in range(N):
            lo, hi = max(0, i - 14), min(N, i + 15)
            m = mask[lo:hi]
            if m.sum() < 5: lo, hi = max(0, i - 30), min(N, i + 31); m = mask[lo:hi]
            out[i] = np.polyval(np.polyfit(tt[lo:hi][m], r[lo:hi][m], 2 if m.sum() >= 8 else 1), i)
        return out
    for _ in range(8):
        renv = smooth(good)
        good = (r - renv) > -0.012
    renv = smooth(good)
    print('klatki z wyciekiem dolnej krawędzi:', int((~good).sum()))
    for i in range(N):
        aL, bL, aR, bR = lines[i]
        Hh = Wt[i] / renv[i]
        yl = Q[i, 0, 1] + Hh; yr = Q[i, 1, 1] + Hh
        Q[i, 3] = (aL * yl + bL, yl); Q[i, 2] = (aR * yr + bR, yr)
    # wygładzenie w czasie: lokalna regresja kwadratowa w oknie 15 klatek
    S = Q.copy(); half = 7
    t = np.arange(N)
    for i in range(N):
        lo, hi = max(0, i - half), min(N, i + half + 1)
        for c in range(4):
            for d in range(2):
                p = np.polyfit(t[lo:hi], Q[lo:hi, c, d], 2 if hi - lo >= 5 else 1)
                S[i, c, d] = np.polyval(p, i)
    jitter = np.abs(S - Q).max()
    S[:, :, 0] /= w; S[:, :, 1] /= h
    json.dump({'w': w, 'h': h, 'frames': N, 'quads': [[round(float(v), 5) for v in f.reshape(-1)] for f in S]}, open(out, 'w'))
    print('frames', N, 'seed', best, 'max residual px', round(float(jitter), 2))
    return S, w, h

if __name__ == '__main__':
    d, n_last, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    S, w, h = main(d, n_last, out)
    # podgląd: obrys na kilku klatkach
    sheet = Image.new('RGB', (4 * 486, 2 * 276), '#777')
    for i, n in enumerate([1, 40, 90, 140, 180, 205, 215, n_last]):
        im = Image.open(f'{d}/f{n:03d}.jpg').convert('RGB')
        q = [(float(x) * w, float(y) * h) for x, y in S[n - 1]]
        ImageDraw.Draw(im).polygon(q, outline=(0, 255, 120), width=3)
        sheet.paste(im.resize((480, 270)), (3 + (i % 4) * 486, 3 + (i // 4) * 276))
    sheet.save(out.replace('.json', '-debug.jpg'), quality=88)
