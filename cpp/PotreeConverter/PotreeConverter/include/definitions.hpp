
#ifndef DEFINITIONS_H
#define DEFINITIONS_H

namespace Potree{

enum class OutputFormat{
	BINARY,
	LAS,
	LAZ
};

enum class StoreOption{
	ABORT_IF_EXISTS,
	OVERWRITE,
	INCREMENTAL
};

enum class ConversionQuality{
	FAST,
	DEFAULT,
	NICE
};

}

#endif