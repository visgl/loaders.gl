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
