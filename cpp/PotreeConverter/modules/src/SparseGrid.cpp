
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