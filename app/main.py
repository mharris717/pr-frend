import os


def respond():
    es = os.environ

    for k in sorted(es.keys()):
        print(f"{k}: {es[k]}")


respond()
