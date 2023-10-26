# Schema

loaders.gl provides a simple serializable schema class to help describe tables and table like data. 
The Schema is modelled after Arrow.


## Schema Deduction

Schemas can be deduced, but unless the data format is binary, this can lead to mistakes.

For instance, should a column with zip codes in a CSV be treated as strings or numbers? (Most auto detection systems would classify the type as numbers, but most users would prefer for that column to be classified as string, to avoid potential dropping of leading zeroes among other things.)

## Schema Serialization

..

## Apache Arrow Schemas

...
