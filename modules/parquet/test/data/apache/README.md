<!--
  ~ Licensed to the Apache Software Foundation (ASF) under one
  ~ or more contributor license agreements.  See the NOTICE file
  ~ distributed with this work for additional information
  ~ regarding copyright ownership.  The ASF licenses this file
  ~ to you under the Apache License, Version 2.0 (the
  ~ "License"); you may not use this file except in compliance
  ~ with the License.  You may obtain a copy of the License at
  ~
  ~   http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing,
  ~ software distributed under the License is distributed on an
  ~ "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  ~ KIND, either express or implied.  See the License for the
  ~ specific language governing permissions and limitations
  ~ under the License.
  -->
# Test data files for Parquet compatibility and regression testing

| File  | Description |
|---|---|
| nested_structs.rust.parquet  | Used to test that the Rust Arrow reader can lookup the correct field from a nested struct. See [ARROW-11452](https://issues.apache.org/jira/browse/ARROW-11452) |


TODO: Document what each file is in the table above.

## Encrypted Files

Tests files with .parquet.encrypted suffix are encrypted using Parquet Modular Encryption.

A detailed description of the Parquet Modular Encryption specification can be found here:
```
 https://github.com/apache/parquet-format/blob/encryption/Encryption.md
```

Following are the keys and key ids (when using key\_retriever) used to encrypt the encrypted columns and footer in the all the encrypted files:
* Encrypted/Signed Footer:
  * key:   {0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5}
  * key_id: "kf"
* Encrypted column named double_field:
  * key:  {1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,0}
  * key_id: "kc1"
* Encrypted column named float_field:
  * key: {1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,1}
  * key_id: "kc2"

The following files are encrypted with AAD prefix "tester":
1. encrypt\_columns\_and\_footer\_disable\_aad\_storage.parquet.encrypted
2. encrypt\_columns\_and\_footer\_aad.parquet.encrypted


A sample that reads and checks these files can be found at the following tests:
```
cpp/src/parquet/encryption-read-configurations-test.cc
cpp/src/parquet/test-encryption-util.h
```
