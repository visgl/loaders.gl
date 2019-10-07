
#ifndef POTREEEXCEPTION_H
#define POTREEEXCEPTION_H

// using standard exceptions
#include <iostream>
#include <exception>
#include <string>

using std::exception;
using std::string;

namespace Potree{

class PotreeException: public exception{
private:
	string message;

public:
	PotreeException(string message){
		this->message = message;
	}

	virtual ~PotreeException() throw(){
	}
	
	virtual const char* what() const throw(){    
		return message.c_str();
	}
};

}

#endif