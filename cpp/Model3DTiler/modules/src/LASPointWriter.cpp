
#include <vector>

#include "LASPointWriter.hpp"

using std::vector;

namespace Potree{

void LASPointWriter::write(const Point &point){

	coordinates[0] = point.position.x;
	coordinates[1] = point.position.y;
	coordinates[2] = point.position.z;
	laszip_set_coordinates(writer, coordinates);

	this->point->rgb[0] = point.color.x * 256;
	this->point->rgb[1] = point.color.y * 256;
	this->point->rgb[2] = point.color.z * 256;

	this->point->intensity = point.intensity;
	this->point->classification = point.classification;
	this->point->return_number = point.returnNumber;
	this->point->number_of_returns = point.numberOfReturns;
	this->point->point_source_ID = point.pointSourceID;
	
	laszip_set_point(writer, this->point);
	laszip_write_point(writer);

	numPoints++;
}

}