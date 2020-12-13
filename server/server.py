from flask import Flask, jsonify, request
from flask_cors import CORS
import networkx as nx

from dotmotif import Motif


__version__ = "0.1.0"


APP = Flask(__name__)
CORS(APP)


@APP.route("/")
def index():
    return jsonify({"server_version": __version__})


@APP.route("/parse", methods=["POST"])
def motif_syntax_to_graph():
    payload = request.get_json()
    if "motif" not in payload:
        return jsonify({"status": "No motif provided."}), 500

    # Adding a comment is a clever way of preventing the Motif
    # constructor from looking on disk and doing anything nefarious.
    motif_text = "# Generated in MotifStudio. \n" + payload["motif"]

    motif = Motif(motif_text)
    nx_g = motif.to_nx()
    json_g = nx.readwrite.node_link_data(nx_g)

    return jsonify({"motif": json_g})


if __name__ == "__main__":
    APP.run(debug=True)