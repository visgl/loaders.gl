
#include <chrono>
#include <vector>
#include <map>
#include <string>
#include <exception>
#include <fstream>

#include "AABB.h"
#include "PotreeConverter.h"
#include "PotreeException.h"

#include "arguments.hpp"
#include <experimental/filesystem>

namespace fs = std::experimental::filesystem;

using std::string;
using std::cout;
using std::cerr;
using std::endl;
using std::vector;
using std::binary_function;
using std::map;
using std::chrono::high_resolution_clock;
using std::chrono::milliseconds;
using std::chrono::duration_cast;
using std::exception;
using Potree::PotreeConverter;
using Potree::StoreOption;
using Potree::ConversionQuality;

#define MAX_FLOAT std::numeric_limits<float>::max()

class SparseGrid;

struct PotreeArguments {
	bool help = false;
	StoreOption storeOption = StoreOption::ABORT_IF_EXISTS;
	vector<string> source;
	string outdir;
	float spacing;
	int levels;
	string format;
	double scale;
	int diagonalFraction;
	Potree::OutputFormat outFormat;
	vector<double> colorRange;
	vector<double> intensityRange;
	vector<string> outputAttributes;
	bool generatePage;
	bool pageTemplate;
	string pageTemplatePath = "";
	vector<double> aabbValues;
	string pageName = "";
	string projection = "";
	bool sourceListingOnly = false;
	string listOfFiles = "";
	ConversionQuality conversionQuality = ConversionQuality::DEFAULT;
	string conversionQualityString = "";
	string title = "PotreeViewer";
	string description = "";
	bool edlEnabled = false;
	bool showSkybox = false;
	string material = "RGB";
    string executablePath;
	int storeSize;
	int flushLimit;
};

PotreeArguments parseArguments(int argc, char **argv){
	Arguments args(argc, argv);

	args.addArgument("source,i,", "input files");
	args.addArgument("help,h", "prints usage");
	args.addArgument("generate-page,p", "Generates a ready to use web page with the given name.");
	args.addArgument("page-template", "directory where the web page template is located.");
	args.addArgument("outdir,o", "output directory");
	args.addArgument("spacing,s", "Distance between points at root level. Distance halves each level.");
	args.addArgument("spacing-by-diagonal-fraction,d", "Maximum number of points on the diagonal in the first level (sets spacing). spacing = diagonal / value");
	args.addArgument("levels,l", "Number of levels that will be generated. 0: only root, 1: root and its children, ...");
	args.addArgument("input-format,f", "Input format. xyz: cartesian coordinates as floats, rgb: colors as numbers, i: intensity as number");
	args.addArgument("color-range", "");
	args.addArgument("intensity-range", "");
	args.addArgument("output-format", "Output format can be BINARY, LAS or LAZ. Default is BINARY");
	args.addArgument("output-attributes,a", "can be any combination of RGB, INTENSITY and CLASSIFICATION. Default is RGB.");
	args.addArgument("scale", "Scale of the X, Y, Z coordinate in LAS and LAZ files.");
	args.addArgument("aabb", "Bounding cube as \"minX minY minZ maxX maxY maxZ\". If not provided it is automatically computed");
	args.addArgument("incremental", "Add new points to existing conversion");
	args.addArgument("overwrite", "Replace existing conversion at target directory");
	args.addArgument("source-listing-only", "Create a sources.json but no octree.");
	args.addArgument("projection", "Specify projection in proj4 format.");
	args.addArgument("list-of-files", "A text file containing a list of files to be converted.");
	args.addArgument("source", "Source file. Can be LAS, LAZ, PTX or PLY");
	args.addArgument("title", "Page title");
	args.addArgument("description", "Description to be shown in the page.");
	args.addArgument("edl-enabled", "Enable Eye-Dome-Lighting.");
	args.addArgument("show-skybox", "");
	args.addArgument("material", "RGB, ELEVATION, INTENSITY, INTENSITY_GRADIENT, CLASSIFICATION, RETURN_NUMBER, SOURCE, LEVEL_OF_DETAIL");
	args.addArgument("store-size", "A node is split once more than store-size points are added. Reduce for better results at cost of performance. Default is 20000");
	args.addArgument("flush-limit", "Flush after X points. Default is 10000000");

	PotreeArguments a;

	if (args.has("help")){
		cout << args.usage() << endl;
		exit(0);
	} else if (!args.has("source") && !args.has("list-of-files")){
		cout << args.usage() << endl;
		exit(1);
	} else if (argc == 1) {
		cout << args.usage() << endl;
		exit(0);
	}

	if (args.has("incremental") && args.has("overwrite")) {
		cout << "cannot have --incremental and --overwrite at the same time";
		exit(1);
	}

	///a.source = args.get("source").as<vector<string>>();
	a.generatePage = args.has("generate-page");
	if (a.generatePage) {
		a.pageName = args.get("generate-page").as<string>();
	}
	a.pageTemplate = args.has("page-template");
	if (a.pageTemplate) {
		a.pageTemplatePath = args.get("page-template").as<string>();
	}
	a.outdir = args.get("outdir").as<string>();
	a.spacing = args.get("spacing").as<double>(0.0);
	a.storeSize = args.get("store-size").as<int>(20'000);
	a.flushLimit= args.get("flush-limit").as<int>(10'000'000);
	a.diagonalFraction = args.get("d").as<double>(0.0);
	a.levels = args.get("levels").as<int>(-1);
	a.format = args.get("input-format").as<string>();
	a.colorRange = args.get("color-range").as<vector<double>>();
	a.intensityRange = args.get("intensity-range").as<vector<double>>();
	
	if (args.has("output-format")) {
		string of = args.get("output-format").as<string>("BINARY");

		if (of == "BINARY") {
			a.outFormat = Potree::OutputFormat::BINARY;
		} else if (of == "LAS") {
			a.outFormat = Potree::OutputFormat::LAS;
		} else if (of == "LAZ") {
			a.outFormat = Potree::OutputFormat::LAZ;
		} else {
			a.outFormat = Potree::OutputFormat::BINARY;
		}
	} else {
		a.outFormat = Potree::OutputFormat::BINARY;
	}

	if (args.has("output-attributes")) {
		a.outputAttributes = args.get("output-attributes").as<vector<string>>();
	} else {
		a.outputAttributes = { "RGB" };
	}

	a.scale = args.get("scale").as<double>(0.0);
	
	if (args.has("aabb")) {
		string strAABB = args.get("aabb").as<string>();
		vector<double> aabbValues;
		char sep = ' ';
		for (size_t p = 0, q = 0; p != strAABB.npos; p = q)
			aabbValues.push_back(atof(strAABB.substr(p + (p != 0), (q = strAABB.find(sep, p + 1)) - p - (p != 0)).c_str()));

		if (aabbValues.size() != 6) {
			cerr << "AABB requires 6 arguments" << endl;
			exit(1);
		}

		a.aabbValues = aabbValues;
	}

	if(args.has("incremental")){
		a.storeOption = StoreOption::INCREMENTAL;
	}else if(args.has("overwrite")){
		a.storeOption = StoreOption::OVERWRITE;
	}else{
		a.storeOption = StoreOption::ABORT_IF_EXISTS;
	}

	a.sourceListingOnly = args.has("source-listing-only");
	a.projection = args.get("projection").as<string>();

	if (args.has("source")) {
		a.source = args.get("source").as<vector<string>>();
	}
	if (a.source.size() == 0 && args.has("list-of-files")) {
		string lof = args.get("list-of-files").as<string>();
		a.listOfFiles = lof;

		if (fs::exists(fs::path(a.listOfFiles))) {
			std::ifstream in(a.listOfFiles);
			string line;
			while (std::getline(in, line)) {
				string path;
				if (fs::path(line).is_absolute()) {
					path = line;
				} else {
					fs::path absPath = fs::canonical(fs::path(a.listOfFiles));
					fs::path lofDir = absPath.parent_path();
					path = lofDir.string() + "/" + line;
				}

				if (fs::exists(fs::path(path))) {
					a.source.push_back(path);
				} else {
					cerr << "ERROR: file not found: " << path << endl;
					exit(1);
				}
			}
			in.close();
		} else {
			cerr << "ERROR: specified list of files not found: '" << a.listOfFiles << "'" << endl;
			exit(1);
		}
	}

	a.title = args.get("title").as<string>();
	a.description = args.get("description").as<string>();
	a.edlEnabled = args.has("edl-enabled");
	a.showSkybox = args.has("show-skybox");
	a.material = args.get("material").as<string>("RGB");

	vector<string> validMaterialNames = {"RGB", "ELEVATION", "INTENSITY", "INTENSITY_GRADIENT", "CLASSIFICATION", "RETURN_NUMBER", "SOURCE", "LEVEL_OF_DETAIL"};
	if(std::find(validMaterialNames.begin(), validMaterialNames.end(), a.material) == validMaterialNames.end()){
		cout << args.usage();
		cout << endl;
		cout << "ERROR: " << "invalid material name specified" << endl;
		exit(1);
	}

	// set default parameters 
	fs::path pSource(a.source[0]);
	a.outdir = args.has("outdir") ? args.get("outdir").as<string>() : pSource.generic_string() + "_converted";
	
	if (a.diagonalFraction != 0) {
		a.spacing = 0;
	}else if(a.spacing == 0){
		a.diagonalFraction = 200;
	}

   try {
    auto absolutePath = fs::canonical(fs::system_complete(argv[0]));
    a.executablePath = absolutePath.parent_path().string();
   } catch (const fs::filesystem_error &e) {
     // do nothing
   }

	return a;
}

void printArguments(PotreeArguments &a){
	try{

		cout << "== params ==" << endl;
		int i = 0;
		for(const auto &s : a.source) {
			cout << "source[" << i << "]:         \t" << a.source[i] << endl;
			++i;
		}
		cout << "outdir:            \t" << a.outdir << endl;
		cout << "spacing:           \t" << a.spacing << endl;
		cout << "diagonal-fraction: \t" << a.diagonalFraction << endl;
		cout << "levels:            \t" << a.levels << endl;
		cout << "format:            \t" << a.format << endl;
		cout << "scale:             \t" << a.scale << endl;
		cout << "pageName:          \t" << a.pageName << endl;
		cout << "projection:        \t" << a.projection << endl;
		cout << endl;
	}catch(exception &e){
		cout << "ERROR: " << e.what() << endl;

		exit(1);
	}
}

#include "Vector3.h"
#include <random>


int main(int argc, char **argv){
	cout.imbue(std::locale(""));
	
	try{
		PotreeArguments a = parseArguments(argc, argv);
		printArguments(a);

        PotreeConverter pc(a.executablePath, a.outdir, a.source);

		pc.spacing = a.spacing;
		pc.diagonalFraction = a.diagonalFraction;
		pc.maxDepth = a.levels;
		pc.format = a.format;
		pc.colorRange = a.colorRange;
		pc.intensityRange = a.intensityRange;
		pc.scale = a.scale;
		pc.outputFormat = a.outFormat;
		pc.outputAttributes = a.outputAttributes;
		pc.aabbValues = a.aabbValues;
		pc.pageName = a.pageName;
		pc.pageTemplatePath = a.pageTemplatePath;
		pc.storeOption = a.storeOption;
		pc.projection = a.projection;
		pc.sourceListingOnly = a.sourceListingOnly;
		pc.quality = a.conversionQuality;
		pc.title = a.title;
		pc.description = a.description;
		pc.edlEnabled = a.edlEnabled;
		pc.material = a.material;
		pc.showSkybox = a.showSkybox;
		pc.storeSize = a.storeSize;
		pc.flushLimit = a.flushLimit;

		pc.convert();
	}catch(exception &e){
		cout << "ERROR: " << e.what() << endl;
		return 1;
	}
	
	return 0;
}

