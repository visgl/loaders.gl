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

#ifndef STUFF_H
#define STUFF_H

#include <vector>
#include <map>
#include <iostream>
#include <math.h>
#include <string>
#include <fstream>
#include <cctype>

//#include <unistd.h>
#include <sys/stat.h>
#include <sys/types.h>

#include <experimental/filesystem>

#include "Vector3.h"
#include "AABB.h"
#include "Point.h"
#include "SparseGrid.h"
#include "GridCell.h"

using std::ifstream;
using std::ofstream;
using std::ios;
using std::string;
using std::min;
using std::max;
using std::ostream;
using std::cout;
using std::cin;
using std::endl;
using std::vector;
using std::binary_function;
using std::map;

namespace fs = std::experimental::filesystem;

namespace Potree {

	AABB readAABB(string fIn, int numPoints);

	AABB readAABB(string fIn);

	/**
	 *   y
	 *   |-z
	 *   |/
	 *   O----x
	 *
	 *   3----7
	 *  /|   /|
	 * 2----6 |
	 * | 1--|-5
	 * |/   |/
	 * 0----4
	 *
	 */
	AABB childAABB(const AABB &aabb, const int &index);


	/**
	 *   y
	 *   |-z
	 *   |/
	 *   O----x
	 *
	 *   3----7
	 *  /|   /|
	 * 2----6 |
	 * | 1--|-5
	 * |/   |/
	 * 0----4
	 *
	 */
	int nodeIndex(const AABB &aabb, const Point &point);


	/**
	 * from http://stackoverflow.com/questions/5840148/how-can-i-get-a-files-size-in-c
	 */
	long filesize(string filename);


	/**
	 * from http://stackoverflow.com/questions/874134/find-if-string-endswith-another-string-in-c
	 */
	bool endsWith(std::string const &fullString, std::string const &ending);

	/**
	 * see http://stackoverflow.com/questions/735204/convert-a-string-in-c-to-upper-case
	 */
	string toUpper(string str);

	bool copyDir(fs::path source, fs::path destination);

	float psign(float value);

	// see https://stackoverflow.com/questions/23943728/case-insensitive-standard-string-comparison-in-c
	bool icompare_pred(unsigned char a, unsigned char b);

	// see https://stackoverflow.com/questions/23943728/case-insensitive-standard-string-comparison-in-c
	bool icompare(string const& a, string const& b);

	bool endsWith(const string &str, const string &suffix);

	bool iEndsWith(const string &str, const string &suffix);

	vector<string> split(string str, vector<char> delimiters);

	vector<string> split(string str, char delimiter);

	// see https://stackoverflow.com/questions/216823/whats-the-best-way-to-trim-stdstring
	string ltrim(string s);

	// see https://stackoverflow.com/questions/216823/whats-the-best-way-to-trim-stdstring
	string rtrim(string s);

	// see https://stackoverflow.com/questions/216823/whats-the-best-way-to-trim-stdstring
	string trim(string s);

}




#endif
