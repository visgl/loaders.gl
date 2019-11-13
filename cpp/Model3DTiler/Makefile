.PHONY: default
default: build

.PHONY: LAStools
LAStools:
	[ -d $@ ] || git clone https://github.com/m-schuetz/LAStools.git
	cd LAStools/LASzip && \
	mkdir -p build && cd build && \
	cmake -DCMAKE_BUILD_TYPE=Release .. && \
	make -j$(nproc)

.PHONY: build
build: LAStools
	mkdir -p build && cd build && \
	cmake .. \
		-DCMAKE_BUILD_TYPE=Release \
		-DLASZIP_INCLUDE_DIRS=../LAStools/LASzip/dll \
		-DLASZIP_LIBRARY=$(PWD)/../PotreeConverter/LAStools/LASzip/build/src/liblaszip.so && \
	make -j$(nproc)

.PHONY: clean
clean:
	rm -rf LAStools build
