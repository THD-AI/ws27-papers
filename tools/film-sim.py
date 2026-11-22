# Frames for the `film` figure (section 4): one frame per round of checks on
# the distance-7 surface code, as Stim simulates it. A lit point is a
# detection event: a check whose answer changed since the round before.
# Data only; the figure is drawn in JavaScript (figures/film.js).
#   <seminar venv python> tools/film-sim.py > articles/other-half/data/film.json
import json, sys
import stim

D, ROUNDS, SEED = 7, 40, 20261122
NOISES = [0.005]

def run(p):
    c = stim.Circuit.generated('surface_code:rotated_memory_z', distance=D, rounds=ROUNDS,
                               after_clifford_depolarization=p, before_round_data_depolarization=p,
                               before_measure_flip_probability=p, after_reset_flip_probability=p)
    coords = c.get_detector_coordinates()
    qc = c.get_final_qubit_coordinates()
    sampler = c.compile_detector_sampler(seed=SEED)
    shot = sampler.sample(shots=1)[0]
    # check positions: the (x, y) of every detector; a check that has a detector in the first round is a flip-check (Z) in this memory experiment
    first = {(v[0], v[1]) for k, v in coords.items() if v[2] == 0}
    checks = sorted({(v[0], v[1]) for v in coords.values()})
    ids = {xy: i for i, xy in enumerate(checks)}
    frames = [[] for _ in range(ROUNDS + 1)]
    for k, v in coords.items():
        if shot[k]:
            frames[int(v[2])].append(ids[(v[0], v[1])])
    data = sorted({(v[0], v[1]) for v in qc.values()} - set(checks))
    # how often a check fires per round, over many runs: all checks, and the
    # inner (weight-4) ones, the like-for-like comparison with Google's 8.7%
    many = c.compile_detector_sampler(seed=SEED + 1).sample(shots=20000)
    dset = set(data)
    def weight(x, y):
        return sum((x + dx, y + dy) in dset for dx in (-1, 1) for dy in (-1, 1))
    later = [k for k, v in coords.items() if v[2] >= 1]
    inner = [k for k in later if weight(coords[k][0], coords[k][1]) == 4]
    rate_all = float(many[:, later].mean())
    rate_inner = float(many[:, inner].mean())
    return {
        'noise': p,
        'checks': [{'x': x, 'y': y, 'kind': 'Z' if (x, y) in first else 'X'} for x, y in checks],
        'qubits': [{'x': x, 'y': y} for x, y in data],
        'frames': [sorted(f) for f in frames[:ROUNDS]],
        'lit_per_frame_mean': round(sum(len(f) for f in frames[:ROUNDS]) / ROUNDS, 2),
        'fire_rate_all': {'value': round(rate_all, 4), 'meaning': 'share of checks that fire per round, rounds 1 on, mean over 20,000 runs'},
        'fire_rate_inner': {'value': round(rate_inner, 4), 'meaning': 'the same for the inner (weight-4) checks only, comparable to the 8.7% Google reports at distance 7', 'compare': {'value': 0.087, 'source': 'GQA-2024'}},
    }

out = {
    '_note': 'Frames for the film figure: a seeded Stim simulation, not Google\'s recording. Written by tools/film-sim.py; never edit by hand.',
    'source': 'OWN-FILM-SIM',
    'stim_version': stim.__version__,
    'circuit': f"surface_code:rotated_memory_z, distance {D}, {ROUNDS} rounds, standard circuit noise (after_clifford_depolarization, before_round_data_depolarization, before_measure_flip_probability, after_reset_flip_probability all = noise)",
    'seed': SEED,
    'meaning': 'A frame is one round; a lit point is a detection event, a check whose answer changed since the round before. Round 0 has flip-check events only (the qubits start known in this basis).',
    'round_us': {'value': 1.1, 'source': 'GQA-2024', 'quote': 'cycle time of 1.1 µs', 'meaning': 'one round of all checks'},
    'checks_d7': {'value': 48, 'source': 'GQA-2024 OWN-ARITH', 'meaning': 'd*d - 1 checks at distance 7'},
    'runs': [run(p) for p in NOISES],
}
json.dump(out, sys.stdout)
