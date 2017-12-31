git clone https://github.com/bfan1256/bible-study-application-backend.git
mkdir ~/Downloads
cd Downloads
wget https://repo.continuum.io/archive/Anaconda3-5.0.1-Linux-x86_64.sh
wget http://nlp.stanford.edu/data/glove.6B.zip
unzip ./glove.6B.zip
mv glove.6B.200d.txt ~/bible-study-application-backend/server/files/
sudo yum install tmux
adduser elasticsearch-user
su - elasticsearch-user
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-6.1.1.zip
unzip elasticsearch-6.1.1.zip && mv elasticsearch-6.1.1 ../elasticsearch