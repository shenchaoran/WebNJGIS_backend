# params: skip n line
# params: column number
# params: column scale

import csv
import os
filename='IBIS_site_output_test.txt'
with open(filename,'r')as file:
    reader=csv.reader(file)
    header_row=next(reader)
    print(header_row)
    for index,column_header in enumerate(header_row):
        print(index,column_header)