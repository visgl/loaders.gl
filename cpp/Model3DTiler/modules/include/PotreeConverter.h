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

#ifndef POTREE_CONVERTER_H
#define POTREE_CONVERTER_H

#include "AABB.h"
#include "CloudJS.hpp"
#include "definitions.hpp"
#include "PointReader.h"

#include <string>
#include <vector>
#include <cstdint>

using std::vector;
using std::string;

namespace Potree{

class SparseGrid;

class PotreeConverter{

private:
	AABB aabb;
	vector<string> sources;
	string workDir;
	CloudJS cloudjs;
	PointAttributes pointAttributes;

	PointReader *createPointReader(string source, PointAttributes pointAttributes);
	void prepare();
	AABB calculateAABB();
	void generatePage(string name);

public:
	float spacing;
	int maxDepth;
	string format;
	OutputFormat outputFormat;
	vector<string> outputAttributes;
	vector<double> colorRange;
	vector<double> intensityRange;
	double scale = 0.01;
	int diagonalFraction = 250;
	vector<double> aabbValues;
	string pageName = "";
	string pageTemplatePath = "";
	StoreOption storeOption = StoreOption::ABORT_IF_EXISTS;
	string projection = "";
	bool sourceListingOnly = false;
	ConversionQuality quality = ConversionQuality::DEFAULT;
	string title = "PotreeViewer";
	string description = "";
	bool edlEnabled = false;
	bool showSkybox = false;
	string material = "RGB";
    string executablePath;
	int storeSize = 20'000;
	int flushLimit = 10'000'000;

    PotreeConverter(string executablePath, string workDir, vector<string> sources);
		
	void convert();

};

}

#endif
