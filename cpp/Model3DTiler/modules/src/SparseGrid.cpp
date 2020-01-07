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

#include <iostream>
#include <math.h>

#include "SparseGrid.h"
#include "GridIndex.h"

using std::min;

namespace Potree{

	const double cellSizeFactor = 5.0;

SparseGrid::SparseGrid(AABB aabb, float spacing){
	this->aabb = aabb;
	this->width =	(int)(aabb.size.x / (spacing * cellSizeFactor) );
	this->height =	(int)(aabb.size.y / (spacing * cellSizeFactor) );
	this->depth =	(int)(aabb.size.z / (spacing * cellSizeFactor) );
	this->squaredSpacing = spacing * spacing;
}

SparseGrid::~SparseGrid(){
	SparseGrid::iterator it;
	for(it = begin(); it != end(); it++){
		delete it->second;
	}
}


bool SparseGrid::isDistant(const Vector3<double> &p, GridCell *cell){
	if(!cell->isDistant(p, squaredSpacing)){
		return false;
	}

	for(const auto &neighbour : cell->neighbours) {
		if(!neighbour->isDistant(p, squaredSpacing)){
			return false;
		}
	}

	return true;
}

bool SparseGrid::isDistant(const Vector3<double> &p, GridCell *cell, float &squaredSpacing){
	if(!cell->isDistant(p, squaredSpacing)){
		return false;
	}

	for(const auto &neighbour : cell->neighbours) {
		if(!neighbour->isDistant(p, squaredSpacing)){
			return false;
		}
	}

	return true;
}

bool SparseGrid::willBeAccepted(const Vector3<double> &p, float &squaredSpacing){
	int nx = (int)(width*(p.x - aabb.min.x) / aabb.size.x);
	int ny = (int)(height*(p.y - aabb.min.y) / aabb.size.y);
	int nz = (int)(depth*(p.z - aabb.min.z) / aabb.size.z);

	int i = min(nx, width-1);
	int j = min(ny, height-1);
	int k = min(nz, depth-1);

	GridIndex index(i,j,k);
	long long key = ((long long)k << 40) | ((long long)j << 20) | (long long)i;
	SparseGrid::iterator it = find(key);
	if(it == end()){
		it = this->insert(value_type(key, new GridCell(this, index))).first;
	}

	if(isDistant(p, it->second, squaredSpacing)){
		return true;
	}else{
		return false;
	}
}


//bool SparseGrid::willBeAccepted(const Vector3<double> &p, float &squaredSpacing){
//	float spacing = sqrt(squaredSpacing);
//	float cellSize = sqrt(this->squaredSpacing) * cellSizeFactor;
//
//	float fx = (width*(p.x - aabb.min.x) / aabb.size.x);
//	float fy = (height*(p.y - aabb.min.y) / aabb.size.y);
//	float fz = (depth*(p.z - aabb.min.z) / aabb.size.z);
//
//	float cx = fmod(fx, cellSize);
//	float cy = fmod(fy, cellSize);
//	float cz = fmod(fz, cellSize);
//
//	bool inner = cx < spacing || cx > (cellSize - spacing);
//	inner = inner && (cy < spacing || cy > (cellSize - spacing));
//	inner = inner && (cz < spacing || cz > (cellSize - spacing));
//
//	int nx = (int)fx;
//	int ny = (int)fy;
//	int nz = (int)fz;
//
//	int i = min(nx, width-1);
//	int j = min(ny, height-1);
//	int k = min(nz, depth-1);
//
//	GridIndex index(i,j,k);
//	long long key = ((long long)k << 40) | ((long long)j << 20) | (long long)i;
//	SparseGrid::iterator it = find(key);
//	if(it == end()){
//		it = this->insert(value_type(key, new GridCell(this, index))).first;
//	}
//
//	if(!it->second->isDistant(p, squaredSpacing)){
//		return false;
//	}
//
//	if(!inner){
//		for(const auto &neighbour : it->second->neighbours) {
//			if(!neighbour->isDistant(p, squaredSpacing)){
//				return false;
//			}
//		}
//	}
//
//	return true;
//}

bool SparseGrid::willBeAccepted(const Vector3<double> &p){
	int nx = (int)(width*(p.x - aabb.min.x) / aabb.size.x);
	int ny = (int)(height*(p.y - aabb.min.y) / aabb.size.y);
	int nz = (int)(depth*(p.z - aabb.min.z) / aabb.size.z);

	int i = min(nx, width-1);
	int j = min(ny, height-1);
	int k = min(nz, depth-1);

	GridIndex index(i,j,k);
	long long key = ((long long)k << 40) | ((long long)j << 20) | (long long)i;
	SparseGrid::iterator it = find(key);
	if(it == end()){
		it = this->insert(value_type(key, new GridCell(this, index))).first;
	}

	if(isDistant(p, it->second)){
		return true;
	}else{
		return false;
	}
}

bool SparseGrid::add(Vector3<double> &p){
	int nx = (int)(width*(p.x - aabb.min.x) / aabb.size.x);
	int ny = (int)(height*(p.y - aabb.min.y) / aabb.size.y);
	int nz = (int)(depth*(p.z - aabb.min.z) / aabb.size.z);

	int i = min(nx, width-1);
	int j = min(ny, height-1);
	int k = min(nz, depth-1);

	GridIndex index(i,j,k);
	long long key = ((long long)k << 40) | ((long long)j << 20) | (long long)i;
	SparseGrid::iterator it = find(key);
	if(it == end()){
		it = this->insert(value_type(key, new GridCell(this, index))).first;
	}

	if(isDistant(p, it->second)){
		this->operator[](key)->add(p);
		numAccepted++;
		return true;
	}else{
		return false;
	}
}

void SparseGrid::addWithoutCheck(Vector3<double> &p){
	int nx = (int)(width*(p.x - aabb.min.x) / aabb.size.x);
	int ny = (int)(height*(p.y - aabb.min.y) / aabb.size.y);
	int nz = (int)(depth*(p.z - aabb.min.z) / aabb.size.z);

	int i = min(nx, width-1);
	int j = min(ny, height-1);
	int k = min(nz, depth-1);

	GridIndex index(i,j,k);
	long long key = ((long long)k << 40) | ((long long)j << 20) | (long long)i;
	SparseGrid::iterator it = find(key);
	if(it == end()){
		it = this->insert(value_type(key, new GridCell(this, index))).first;
	}

	it->second->add(p);
}

}
