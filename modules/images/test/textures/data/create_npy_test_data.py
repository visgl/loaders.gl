import numpy as np


def main():
    for dtype in ['uint8', 'uint16', 'uint32', 'float32']:
        arr = np.array([1, 2, 3, 4], dtype=dtype)
        np.save(dtype + '.npy', arr)


if __name__ == '__main__':
    main()
