from flask import jsonify, make_response


def apply_cors(response_tuple):
    data, status = response_tuple
    response = make_response(jsonify(data), status)
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    return response