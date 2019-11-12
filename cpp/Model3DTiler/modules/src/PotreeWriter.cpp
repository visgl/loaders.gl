

#include <cmath>
#include <sstream>
#include <stack>
#include <chrono>
#include <fstream>
#include <iomanip>

#include <experimental/filesystem>

#include "AABB.h"
#include "SparseGrid.h"
#include "stuff.h"
#include "CloudJS.hpp"
#include "PointAttributes.hpp"
#include "PointReader.h"
#include "PointWriter.hpp"
#include "LASPointReader.h"
#include "BINPointReader.hpp"
#include "LASPointWriter.hpp"
#include "BINPointWriter.hpp"
#include "PotreeException.h"

#include "PotreeWriter.h"

using std::ifstream;
using std::stack;
using std::stringstream;
using std::chrono::high_resolution_clock;
using std::chrono::milliseconds;
using std::chrono::duration_cast;

namespace fs = std::experimental::filesystem;

namespace Potree{

PWNode::PWNode(PotreeWriter* potreeWriter, AABB aabb){
	this->potreeWriter = potreeWriter;
	this->aabb = aabb;
	this->grid = new SparseGrid(aabb, spacing());
}

PWNode::PWNode(PotreeWriter* potreeWriter, int index, AABB aabb, int level){
	this->index = index;
	this->aabb = aabb;
	this->level = level;
	this->potreeWriter = potreeWriter;
	this->grid = new SparseGrid(aabb, spacing());
}

PWNode::~PWNode(){
	for(PWNode *child : children){
		if(child != NULL){
			delete child;
		}
	}
	delete grid;
}

string PWNode::name() const {
	if(parent == NULL){
		return "r";
	}else{
		return parent->name() + std::to_string(index);
	}
}

float PWNode::spacing(){
	return float(potreeWriter->spacing / pow(2.0, float(level)));
}

string PWNode::workDir(){
	return potreeWriter->workDir;
}

string PWNode::hierarchyPath(){
	string path = "r/";

	int hierarchyStepSize = potreeWriter->hierarchyStepSize;
	string indices = name().substr(1);

	int numParts = (int)floor((float)indices.size() / (float)hierarchyStepSize);
	for(int i = 0; i < numParts; i++){
		path += indices.substr(i * hierarchyStepSize, hierarchyStepSize) + "/";
	}

	return path;
}

string PWNode::path(){
	string path = hierarchyPath() + name() + potreeWriter->getExtension();
	return path;
}

PointReader *PWNode::createReader(string path){
	PointReader *reader = NULL;
	OutputFormat outputFormat = this->potreeWriter->outputFormat;
	if(outputFormat == OutputFormat::LAS || outputFormat == OutputFormat::LAZ){
		reader = new LASPointReader(path);
	}else if(outputFormat == OutputFormat::BINARY){
		reader = new BINPointReader(path, aabb, potreeWriter->scale, this->potreeWriter->pointAttributes);
	}

	return reader;
}

PointWriter *PWNode::createWriter(string path){
	PointWriter *writer = NULL;
	OutputFormat outputFormat = this->potreeWriter->outputFormat;
	if(outputFormat == OutputFormat::LAS || outputFormat == OutputFormat::LAZ){
		writer = new LASPointWriter(path, aabb, potreeWriter->scale);
	}else if(outputFormat == OutputFormat::BINARY){
		writer = new BINPointWriter(path, aabb, potreeWriter->scale, this->potreeWriter->pointAttributes);
	}

	return writer;


}

void PWNode::loadFromDisk(){

	PointReader *reader = createReader(workDir() + "/data/" + path());
	while(reader->readNextPoint()){
		Point p = reader->getPoint();

		if(isLeafNode()){
			store.push_back(p);
		}else{
			grid->addWithoutCheck(p.position);
		}
	}
	grid->numAccepted = numAccepted;
	reader->close();
	delete reader;

	isInMemory = true;
}

PWNode *PWNode::createChild(int childIndex ){
	AABB cAABB = childAABB(aabb, childIndex);
	PWNode *child = new PWNode(potreeWriter, childIndex, cAABB, level+1);
	child->parent = this;
	children[childIndex] = child;

	return child;
}

void PWNode ::split(){
	children.resize(8, NULL);

	string filepath = workDir() + "/data/" + path();
	if(fs::exists(filepath)){
		fs::remove(filepath);
	}

	for(Point &point : store){
		add(point);
	}

	store = vector<Point>();
}

PWNode *PWNode::add(Point &point){
	addCalledSinceLastFlush = true;

	if(!isInMemory){
		loadFromDisk();
	}

	if(isLeafNode()){
		store.push_back(point);
		if(int(store.size()) >= potreeWriter->storeSize){
			split();
		}

		return this;
	}else{

		bool accepted = false;
		//if(potreeWriter->quality == ConversionQuality::FAST){
			accepted = grid->add(point.position);
		//}else/* if(potreeWriter->quality == ConversionQuality::DEFAULT)*/{
		//	PWNode *node = this;
		//	accepted = true;
		//	while(accepted && node != NULL){
		//		accepted = accepted && node->grid->willBeAccepted(point.position, grid->squaredSpacing);
		//		node = node->parent;
		//	}
		//
		//	//node = this;
		//	//while(accepted && node != NULL && node->children.size() > 0){
		//	//	int childIndex = nodeIndex(node->aabb, point);
		//	//
		//	//	if(childIndex == -1){
		//	//		break;
		//	//	}
		//	//
		//	//	node = node->children[childIndex];
		//	//
		//	//	if(node == NULL){
		//	//		break;
		//	//	}
		//	//
		//	//	accepted = accepted && node->grid->willBeAccepted(point.position, grid->squaredSpacing);
		//	//}
		//
		//	if(accepted){
		//		grid->addWithoutCheck(point.position);
		//	}
		//}/*else if(potreeWriter->quality == ConversionQuality::NICE){
		//	PWNode *node = this;
		//	accepted = true;
		//	while(accepted && node != NULL){
		//		accepted = accepted && node->grid->willBeAccepted(point.position, grid->squaredSpacing);
		//		node = node->parent;
		//	}
		//
		//	node = this;
		//	while(accepted && node != NULL && node->children.size() > 0){
		//		int childIndex = nodeIndex(node->aabb, point);
		//
		//		if(childIndex == -1){
		//			break;
		//		}
		//
		//		node = node->children[childIndex];
		//
		//		if(node == NULL){
		//			break;
		//		}
		//
		//		accepted = accepted && node->grid->willBeAccepted(point.position, grid->squaredSpacing);
		//	}
		//
		//
		//	if(accepted){
		//		grid->addWithoutCheck(point.position);
		//	}
		//}*/

		if(accepted){
			cache.push_back(point);
			acceptedAABB.update(point.position);
			numAccepted++;

			return this;
		}else{
			// try adding point to higher level

			if(potreeWriter->maxDepth != -1 && level >= potreeWriter->maxDepth){
				return NULL;
			}

			int childIndex = nodeIndex(aabb, point);
			if(childIndex >= 0){
				if(isLeafNode()){
					children.resize(8, NULL);
				}
				PWNode *child = children[childIndex];

				// create child node if not existent
				if(child == NULL){
					child = createChild(childIndex);
				}

				return child->add(point);
				//child->add(point, targetLevel);
			} else {
				return NULL;
			}
		}
		return NULL;
	}
}

void PWNode::flush(){

	std::function<void(vector<Point> &points, bool append)> writeToDisk = [&](vector<Point> &points, bool append){
		string filepath = workDir() + "/data/" + path();
		PointWriter *writer = NULL;

		if(!fs::exists(workDir() + "/data/" + hierarchyPath())){
			fs::create_directories(workDir() + "/data/" + hierarchyPath());
		}

		if(append){
			string temppath = workDir() + "/temp/prepend" + potreeWriter->getExtension();
			if(fs::exists(filepath)){
				fs::rename(fs::path(filepath), fs::path(temppath));
			}

			writer = createWriter(filepath);
			if(fs::exists(temppath)){
				PointReader *reader = createReader(temppath);
				while(reader->readNextPoint()){
					writer->write(reader->getPoint());
				}
				reader->close();
				delete reader;
				fs::remove(temppath);
			}
		}else{
			if(fs::exists(filepath)){
				fs::remove(filepath);
			}
			writer = createWriter(filepath);
		}

		for(const auto &e_c : points){
			writer->write(e_c);
		}

		if(append && (writer->numPoints != this->numAccepted)){
			cout << "writeToDisk " << writer->numPoints  << " != " << this->numAccepted << endl;
			exit(1);
		}

		writer->close();
		delete writer;
	};


	if(isLeafNode()){
		if(addCalledSinceLastFlush){
			writeToDisk(store, false);

			//if(store.size() != this->numAccepted){
			//	cout << "store " << store.size() << " != " << this->numAccepted << " - " << this->name() << endl;
			//}
		}else if(!addCalledSinceLastFlush && isInMemory){
			store = vector<Point>();

			isInMemory = false;
		}
	}else{
		if(addCalledSinceLastFlush){
			writeToDisk(cache, true);
			//if(cache.size() != this->numAccepted){
			//	cout << "cache " << cache.size() << " != " << this->numAccepted << " - " << this->name() << endl;
			//
			//	exit(1);
			//}
			cache = vector<Point>();
		}else if(!addCalledSinceLastFlush && isInMemory){
			delete grid;
			grid = new SparseGrid(aabb, spacing());
			isInMemory = false;
		}
	}

	addCalledSinceLastFlush = false;

	for(PWNode *child : children){
		if(child != NULL){
			child->flush();
		}
	}
}

vector<PWNode*> PWNode::getHierarchy(int levels){

	vector<PWNode*> hierarchy;

	list<PWNode*> stack;
	stack.push_back(this);
	while(!stack.empty()){
		PWNode *node = stack.front();
		stack.pop_front();

		if(node->level >= this->level + levels){
			break;
		}
		hierarchy.push_back(node);

		for(PWNode *child : node->children){
			if(child != NULL){
				stack.push_back(child);
			}
		}
	}

	return hierarchy;
}


void PWNode::traverse(std::function<void(PWNode*)> callback){
	callback(this);

	for(PWNode *child : this->children){
		if(child != NULL){
			child->traverse(callback);
		}
	}
}

void PWNode::traverseBreadthFirst(std::function<void(PWNode*)> callback){

	// https://en.wikipedia.org/wiki/Iterative_deepening_depth-first_search

	int currentLevel = 0;
	int visitedAtLevel = 0;

	do{

		// doing depth first search until node->level = curentLevel
		stack<PWNode*> st;
		st.push(this);
		while(!st.empty()){
			PWNode *node = st.top();
			st.pop();

			if(node->level == currentLevel){
				callback(node);
				visitedAtLevel++;
			}else if(node->level < currentLevel){
				for(PWNode *child : node->children){
					if(child != NULL){
						st.push(child);
					}
				}
			}
		}

		currentLevel++;

	}while(visitedAtLevel > 0);
}


PWNode* PWNode::findNode(string name){
	string thisName = this->name();

	if(name.size() == thisName.size()){
		return (name == thisName) ? this : NULL;
	}else if(name.size() > thisName.size()){
		int childIndex = stoi(string(1, name[thisName.size()]));
		if(!isLeafNode() && children[childIndex] != NULL){
			return children[childIndex]->findNode(name);
		}else{
			return NULL;
		}
	}else{
		return NULL;
	}
}
















PotreeWriter::PotreeWriter(string workDir, ConversionQuality quality){
	this->workDir = workDir;
	this->quality = quality;
}

PotreeWriter::PotreeWriter(string workDir, AABB aabb, float spacing, int maxDepth, double scale, OutputFormat outputFormat, PointAttributes pointAttributes, ConversionQuality quality){
	this->workDir = workDir;
	this->aabb = aabb;
	this->spacing = spacing;
	this->scale = scale;
	this->maxDepth = maxDepth;
	this->outputFormat = outputFormat;
	this->quality = quality;

	this->pointAttributes = pointAttributes;

	if(this->scale == 0){
		if(aabb.size.length() > 1'000'000){
			this->scale = 0.01;
		}else if(aabb.size.length() > 100'000){
			this->scale = 0.001;
		}else if(aabb.size.length() > 1){
			this->scale = 0.001;
		}else{
			this->scale = 0.0001;
		}
	}

	cloudjs.outputFormat = outputFormat;
	cloudjs.boundingBox = aabb;
	cloudjs.octreeDir = "data";
	cloudjs.spacing = spacing;
	cloudjs.version = "1.7";
	cloudjs.scale = this->scale;
	cloudjs.pointAttributes = pointAttributes;

	root = new PWNode(this, aabb);
}

string PotreeWriter::getExtension(){
	if(outputFormat == OutputFormat::LAS){
		return ".las";
	}else if(outputFormat == OutputFormat::LAZ){
		return ".laz";
	}else if(outputFormat == OutputFormat::BINARY){
		return ".bin";
	}

	return "";
}

void PotreeWriter::waitUntilProcessed(){
	if(storeThread.joinable()){
		storeThread.join();
	}
}

void PotreeWriter::add(Point &p){
	if(numAdded == 0){
		fs::path dataDir(workDir + "/data");
		fs::path tempDir(workDir + "/temp");

		fs::create_directories(dataDir);
		fs::create_directories(tempDir);
	}

	store.push_back(p);
	numAdded++;

	if(store.size() > 10'000){
		processStore();
	}
}

void PotreeWriter::processStore(){
	vector<Point> st = store;
	store = vector<Point>();

	waitUntilProcessed();

	storeThread = thread([this, st]{
		for(Point p : st){
			PWNode *acceptedBy = root->add(p);
			if(acceptedBy != NULL){
				tightAABB.update(p.position);

				pointsInMemory++;
				numAccepted++;
			}
		}
	});
}

void PotreeWriter::flush(){
	processStore();

	if(storeThread.joinable()){
		storeThread.join();
	}

	//auto start = high_resolution_clock::now();

	root->flush();

	//auto end = high_resolution_clock::now();
	//long long duration = duration_cast<milliseconds>(end-start).count();
	//float seconds = duration / 1'000.0f;
	//cout << "flush nodes: " << seconds << "s" << endl;

	{// update cloud.js
		cloudjs.hierarchy = vector<CloudJS::Node>();
		cloudjs.hierarchyStepSize = hierarchyStepSize;
		cloudjs.tightBoundingBox = tightAABB;
		cloudjs.numAccepted = numAccepted;
		cloudjs.projection = projection;

		ofstream cloudOut(workDir + "/cloud.js", ios::out);
		cloudOut << cloudjs.getString();
		cloudOut.close();
	}



	{// write hierarchy
		//auto start = high_resolution_clock::now();

		int hrcTotal = 0;
		int hrcFlushed = 0;

		list<PWNode*> stack;
		stack.push_back(root);
		while(!stack.empty()){
			PWNode *node = stack.front();
			stack.pop_front();

			hrcTotal++;

			vector<PWNode*> hierarchy = node->getHierarchy(hierarchyStepSize + 1);
			bool needsFlush = false;
			for(const auto &descendant : hierarchy){
				if(descendant->level == node->level + hierarchyStepSize ){
					stack.push_back(descendant);
				}

				needsFlush = needsFlush || descendant->addedSinceLastFlush;
			}


			if(needsFlush){
				string dest = workDir + "/data/" + node->hierarchyPath() + "/" + node->name() + ".hrc";
				ofstream fout;
				fout.open(dest, ios::out | ios::binary);

				for(const auto &descendant : hierarchy){
					char children = 0;
					for(int j = 0; j < (int)descendant->children.size(); j++){
						if(descendant->children[j] != NULL){
							children = children | (1 << j);
						}
					}

					fout.write(reinterpret_cast<const char*>(&children), 1);
					fout.write(reinterpret_cast<const char*>(&(descendant->numAccepted)), 4);
				}

				fout.close();
				hrcFlushed++;
			}
		}

		root->traverse([](PWNode* node){
			node->addedSinceLastFlush = false;
		});

		//cout << "hrcTotal: " << hrcTotal << "; " << "hrcFlushed: " << hrcFlushed << endl;

		//auto end = high_resolution_clock::now();
		//long long duration = duration_cast<milliseconds>(end-start).count();
		//float seconds = duration / 1'000.0f;
		//cout << "writing hierarchy: " << seconds << "s" << endl;

	}
}

void PotreeWriter::setProjection(string projection){
	this->projection = projection;
}

void PotreeWriter::loadStateFromDisk(){


	{// cloudjs
		string cloudJSPath = workDir + "/cloud.js";
		ifstream file(cloudJSPath);
		string line;
		string content;
		while (std::getline(file, line)){
			content += line + "\n";
		}
		cloudjs = CloudJS(content);
	}

	{
		this->outputFormat = cloudjs.outputFormat;
		this->pointAttributes = cloudjs.pointAttributes;
		this->hierarchyStepSize = cloudjs.hierarchyStepSize;
		this->spacing = cloudjs.spacing;
		this->scale = cloudjs.scale;
		this->aabb = cloudjs.boundingBox;
		this->numAccepted = cloudjs.numAccepted;

	}

	{// tree
		vector<string> hrcPaths;
		fs::path rootDir(workDir + "/data/r");
		for (fs::recursive_directory_iterator iter(rootDir), end; iter != end; ++iter){
			fs::path path = iter->path();
			if(fs::is_regular_file(path)){
				if(iEndsWith(path.extension().string(), ".hrc")){
					hrcPaths.push_back(path.string());
				}else{

				}
			}else if(fs::is_directory(path)){

			}
		}
		std::sort(hrcPaths.begin(), hrcPaths.end(), [](string &a, string &b){
			return a.size() < b.size();
		});

		PWNode *root = new PWNode(this, cloudjs.boundingBox);
		for(string hrcPath : hrcPaths){

			fs::path pHrcPath(hrcPath);
			string hrcName = pHrcPath.stem().string();
			PWNode *hrcRoot = root->findNode(hrcName);

			PWNode *current = hrcRoot;
			current->addedSinceLastFlush = false;
			current->isInMemory = false;
			vector<PWNode*> nodes;
			nodes.push_back(hrcRoot);

			ifstream fin(hrcPath, ios::in | ios::binary);
			std::vector<char> buffer((std::istreambuf_iterator<char>(fin)), (std::istreambuf_iterator<char>()));

			for(int i = 0; 5*i < (int)buffer.size(); i++){
				PWNode *current= nodes[i];

				char children = buffer[i*5];
				char *p = &buffer[i*5+1];
				unsigned int* ip = reinterpret_cast<unsigned int*>(p);
				unsigned int numPoints = *ip;

				//std::bitset<8> bs(children);
				//cout << i << "\t: " << "children: " << bs << "; " << "numPoints: " << numPoints << endl;

				current->numAccepted = numPoints;

				if(children != 0){
					current->children.resize(8, NULL);
					for(int j = 0; j < 8; j++){
						if((children & (1 << j)) != 0){
							AABB cAABB = childAABB(current->aabb, j);
							PWNode *child = new PWNode(this, j, cAABB, current->level + 1);
							child->parent = current;
							child->addedSinceLastFlush = false;
							child->isInMemory = false;
							current->children[j] = child;
							nodes.push_back(child);
						}
					}
				}

			}
		}

		this->root = root;

		// TODO set it to actual number
		this->numAdded = 1;

		//int numNodes = 0;
		//root->traverse([&](PWNode *node){
		//	if(numNodes < 50){
		//		cout << std::left << std::setw(10) << node->name();
		//		cout << std::right << std::setw(10) << node->numAccepted << "; ";
		//		cout << node->aabb.min << " - " << node->aabb.max << endl;
		//	}
		//
		//	numNodes++;
		//
		//});
	}


}


}
