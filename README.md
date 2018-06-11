<div style="display: block; text-align:center" align="center"><img width="175px" alt="Biblya Logo" src="./color-logo.svg" /></div>

# Biblya Backend

[![Build Status](https://travis-ci.org/bfan1256/bible-study-application-backend.svg?branch=master)](https://travis-ci.org/bfan1256/bible-study-application-backend)

<b>Description:</b> Backend and API Scripts for BCF 217 Bible Study Application

<b>Authors:</b> bfan1256, JDS0530

## TODO List

## Setup List

### 1. Ruby Setup

1. Install [Ruby](https://www.ruby-lang.org/en/downloads/)
2. `cd ./bible-processing`
3. `bundle install`
4. `ruby app.rb`

### 2. ElasticSearch Setup

5. Download Zip Version of ElasticSearch from https://www.elastic.co/downloads/elasticsearch
6. Unzip file
7. cd into newly created folder and run `bin/elasticsearch`
8. `cd server`
9. `python create_es_index.py`

### 3. Python Setup (Must do ElasticSearch First)

10. Install [Python](https://www.anaconda.com/download/)
11. `cd ./server`
12. `pip install -r requirements.txt`
13. `cd server`
14. Download zip file from http://nlp.stanford.edu/data/glove.6B.zip
15. Unzip zip file and move `glove.6B.200d.txt` to `server/files/`
16. `python server.py`

### 4. Running Python Unit Tests

1. `cd server`
2. Simply run `pytest` from terminal and pytest will handle it all for you

### Optional: Using Gunicorn for Server

1. `cd server`
2. Run `gunicorn server:APP --preload -t 300 --log-file=- --workers=2` in terminal


## Firebase Functions Setup

### Setting Up Environment

1. `cd firebase-functions/functions`
2. `npm install`

### Deploying Functions

1. `cd firebase-functions/functions`
2. `firebase deploy --only functions` (To Deploy All Functions)
3. `firebase deploy --only functions:<function-name>` (To Deploy Certain Function)

## Resources

[Server Hosting](https://www.vultr.com/)

[Server Deployment](https://github.com/githubsaturn/captainduckduck)

[Firebase Functions](https://firebase.google.com/docs/functions/)

[Cloud Firestore Functions](https://firebase.google.com/docs/functions/firestore-events)