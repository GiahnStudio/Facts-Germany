import sys
sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
from multiprocessing import Pool
import specs
if __name__ == "__main__":
    with Pool(2) as p:
        for r in p.map(specs.run, range(len(specs.VIDEOS))): print(r)
