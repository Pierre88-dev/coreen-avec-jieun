"""Serveur local pour essayer le site.

Lance-le en double-cliquant sur demarrer.cmd, ou depuis un terminal :
    python demarrer.py

Ferme la fenetre, ou fais Ctrl+C, pour l'arreter.
"""

import http.server
import os
import socketserver
import sys
import threading
import webbrowser

PORT = 8765
PAGE = "essai.html"

os.chdir(os.path.dirname(os.path.abspath(__file__)))
adresse = "http://127.0.0.1:{}/{}".format(PORT, PAGE)


class Silencieux(http.server.SimpleHTTPRequestHandler):
    """Journal reduit : on ne veut pas noyer la fenetre sous les 200 OK."""

    def log_message(self, format, *args):
        code = str(args[1]) if len(args) > 1 else ""
        if code.startswith("4") or code.startswith("5"):
            sys.stderr.write("  {} {}\n".format(code, args[0]))


def main():
    try:
        socketserver.TCPServer.allow_reuse_address = True
        serveur = socketserver.TCPServer(("127.0.0.1", PORT), Silencieux)
    except OSError:
        print()
        print("  Le port {} est deja pris.".format(PORT))
        print("  Une autre fenetre du serveur tourne peut-etre deja :")
        print("  essaie d'ouvrir directement " + adresse)
        print()
        input("  Appuie sur Entree pour fermer. ")
        return 1

    print()
    print("  Coreen avec Jieun - serveur local")
    print("  Salle d'essai : " + adresse)
    print()
    print("  Ferme cette fenetre pour arreter.")
    print()

    # On attend que le serveur ecoute vraiment avant d'ouvrir le navigateur,
    # sinon la page s'ouvre sur une erreur de connexion.
    threading.Timer(0.8, lambda: webbrowser.open(adresse)).start()

    try:
        serveur.serve_forever()
    except KeyboardInterrupt:
        print("\n  Arrete.")
    finally:
        serveur.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
