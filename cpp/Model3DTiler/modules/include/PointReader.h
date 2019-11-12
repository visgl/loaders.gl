

#ifndef POINTREADER_H
#define POINTREADER_H

#include <experimental/filesystem>

#include "Point.h"
#include "AABB.h"

namespace fs = std::experimental::filesystem;

namespace Potree{

class PointReader{
public:

	virtual ~PointReader(){};

	virtual bool readNextPoint() = 0;

	virtual Point getPoint() = 0;

	virtual AABB getAABB() = 0;

	virtual long long numPoints() = 0;

	virtual void close() = 0;
};

}

#endif