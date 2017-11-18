
<div style="display: block; text-align:center" align="center"><img alt="BCF Logo" src="http://blacksburgchristianfellowship.org/wp-content/uploads/2017/01/yellow-mobile-logo.png" /></div>

# BCF 217 Bible Study Backend 

[![Build Status](https://travis-ci.org/bfan1256/bible-study-application-backend.svg?branch=master)](https://travis-ci.org/bfan1256/bible-study-application-backend)

<b>Description:</b> Backend and API Scripts for BCF 217 Bible Study Application

<b>Authors:</b> bfan1256, JDS0530 

## TODO List
* Implement Flask Logging


## Setup List
### 1. Ruby Setup
1. Install [Ruby](https://www.ruby-lang.org/en/downloads/)
2. `cd ./bible-processing`
3. `bundle install`
4. `ruby app.rb`
### 2. Python Setup
1. Install [Python](https://www.anaconda.com/download/)
2. `cd ./server`
3. `pip install -r requirements.txt`
4. `python server.py`

### 3. Running Python Unit Tests
1. Simply run `pytest` from terminal and pytest will handle it all for you

### Optional: Using Gunicorn for Server
1. Run `gunicorn server:APP --preload -t 300 --log-file=- --worker=2` in terminal
## Resources

[Building a Basic RESTful API in Python ](https://www.codementor.io/sagaragarwal94/building-a-basic-restful-api-in-python-58k02xsiq)
