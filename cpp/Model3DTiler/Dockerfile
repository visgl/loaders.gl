FROM ubuntu:15.10

RUN apt-get update && apt-get install -y g++ git cmake libboost-all-dev
RUN mkdir /data

WORKDIR /data

RUN git clone https://github.com/m-schuetz/LAStools.git
WORKDIR /data/LAStools/LASzip
RUN mkdir build
RUN cd build && cmake -DCMAKE_BUILD_TYPE=Release ..
RUN cd build && make

RUN mkdir ./PotreeConverter
WORKDIR /data/PotreeConverter
ADD . /data/PotreeConverter
RUN mkdir build
RUN cd build && cmake -DCMAKE_BUILD_TYPE=Release -DLASZIP_INCLUDE_DIRS=/data/LAStools/LASzip/dll -DLASZIP_LIBRARY=/data/LAStools/LASzip/build/src/liblaszip.so .. 
RUN cd build && make
RUN cp -R /data/PotreeConverter/PotreeConverter/resources/ /data

