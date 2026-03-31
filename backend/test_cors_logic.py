
import re
from starlette.middleware.cors import CORSMiddleware
from starlette.datastructures import Headers

def test_cors():
    # Simulate the logic of Starlette's CORSMiddleware
    # Based on the regex we used:
    regex_str = r"https://.*\.siagenda\.com|https://siagenda\.com|https://.*\.railway\.app"
    regex = re.compile(regex_str)
    
    origins_to_test = [
        "https://www.siagenda.com",
        "https://siagenda.com",
        "https://sub.siagenda.com",
        "https://agendaia-production.up.railway.app"
    ]
    
    print(f"Testing regex: {regex_str}")
    for origin in origins_to_test:
        match = regex.match(origin)
        print(f"Origin: {origin} -> Match: {match is not None}")

if __name__ == "__main__":
    test_cors()
