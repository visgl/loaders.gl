
#ifndef GRID_CELL_H
#define GRID_CELL_H

#include "Point.h"
#include "GridIndex.h"

#include <math.h>
#include <vector>

using std::vector;

namespace Potree{

class SparseGrid;


class GridCell{
public:
	vector<Vector3<double> > points;
	vector<GridCell*> neighbours;
	SparseGrid *grid;

	GridCell();

	GridCell(SparseGrid *grid, GridIndex &index);

	void add(Vector3<double> p);

	bool isDistant(const Vector3<double> &p, const double &squaredSpacing) const;
};

}

#endif