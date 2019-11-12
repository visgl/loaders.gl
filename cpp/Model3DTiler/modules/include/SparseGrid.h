

#ifndef SPARSE_GRID_H
#define SPARSE_GRID_H

#include "AABB.h"
#include "Point.h"
#include "GridCell.h"

#include <map>
#include <unordered_map>
#include <vector>
#include <math.h>

using std::vector;
using std::map;
using std::unordered_map;
using std::min;
using std::max;

namespace Potree{

#define MAX_FLOAT std::numeric_limits<float>::max()

class SparseGrid : public unordered_map<long long, GridCell*>{
public:
	int width;
	int height;
	int depth;
	AABB aabb;
	float squaredSpacing;
	unsigned int numAccepted = 0;

	SparseGrid(AABB aabb, float minGap);

	SparseGrid(const SparseGrid &other)
		: width(other.width), height(other.height), depth(other.depth), aabb(other.aabb), squaredSpacing(other.squaredSpacing), numAccepted(other.numAccepted)
	{
	}

	~SparseGrid();

	bool isDistant(const Vector3<double> &p, GridCell *cell);

	bool isDistant(const Vector3<double> &p, GridCell *cell, float &squaredSpacing);

	bool willBeAccepted(const Vector3<double> &p);

	bool willBeAccepted(const Vector3<double> &p, float &squaredSpacing);

	bool add(Vector3<double> &p);

	void addWithoutCheck(Vector3<double> &p);

};

}

#endif
