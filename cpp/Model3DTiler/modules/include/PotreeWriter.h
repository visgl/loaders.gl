/*
Copyright (c) 2011-2014, Markus Schütz
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those
of the authors and should not be interpreted as representing official policies,
either expressed or implied, of the FreeBSD Project.
*/

#ifndef POTREEWRITER_H
#define POTREEWRITER_H

#include <string>
#include <thread>
#include <vector>
#include <functional>

#include "AABB.h"
#include "SparseGrid.h"
#include "CloudJS.hpp"
#include "PointAttributes.hpp"

using std::string;
using std::thread;
using std::vector;

namespace Potree{

class PotreeWriter;
class PointReader;
class PointWriter;

class PWNode{

public:
	int index = -1;
	AABB aabb;
	AABB acceptedAABB;
	int level = 0;
	SparseGrid *grid;
	unsigned int numAccepted = 0;
	PWNode *parent = NULL;
	vector<PWNode*> children;
	bool addedSinceLastFlush = true;
	bool addCalledSinceLastFlush = false;
	PotreeWriter *potreeWriter;
	vector<Point> cache;
	//int storeLimit = 20'000;
	vector<Point> store;
	bool isInMemory = true;

	PWNode(PotreeWriter* potreeWriter, AABB aabb);

	PWNode(PotreeWriter* potreeWriter, int index, AABB aabb, int level);

	~PWNode();

	string name() const;

	float spacing();

	bool isLeafNode(){
		return children.size() == 0;
	}

	bool isInnerNode(){
		return children.size() > 0;
	}

	void loadFromDisk();

	PWNode *add(Point &point);

	PWNode *createChild(int childIndex);

	void split();

	string workDir();

	string hierarchyPath();

	string path();

	void flush();

	void traverse(std::function<void(PWNode*)> callback);

	void traverseBreadthFirst(std::function<void(PWNode*)> callback);

	vector<PWNode*> getHierarchy(int levels);

	PWNode* findNode(string name);

private:

	PointReader *createReader(string path);
	PointWriter *createWriter(string path);

};



class PotreeWriter{

public:

	AABB aabb;
	AABB tightAABB;
	string workDir;
	float spacing;
	double scale = 0;
	int maxDepth = -1;
	PWNode *root;
	long long numAdded = 0;
	long long numAccepted = 0;
	CloudJS cloudjs;
	OutputFormat outputFormat;
	PointAttributes pointAttributes;
	int hierarchyStepSize = 5;
	vector<Point> store;
	thread storeThread;
	int pointsInMemory = 0;
	string projection = "";
	ConversionQuality quality = ConversionQuality::DEFAULT;
	int storeSize = 20'000;


	PotreeWriter(string workDir, ConversionQuality quality);

	PotreeWriter(string workDir, AABB aabb, float spacing, int maxDepth, double scale, OutputFormat outputFormat, PointAttributes pointAttributes, ConversionQuality quality);

	~PotreeWriter(){
		close();

		delete root;
	}

	string getExtension();

	void processStore();

	void waitUntilProcessed();

	void add(Point &p);

	void flush();

	void close(){
		flush();
	}

	void setProjection(string projection);

	void loadStateFromDisk();

private:

};

}

#endif
