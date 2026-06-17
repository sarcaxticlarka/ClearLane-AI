# EDA Findings — ClearLane AI

## Shape

- Rows: 298450
- Columns: 24

## Dtypes

```
id                                  str
latitude                        float64
longitude                       float64
location                            str
vehicle_number                      str
vehicle_type                        str
description                     float64
violation_type                      str
offence_code                        str
created_datetime                    str
closed_datetime                 float64
modified_datetime                   str
device_id                           str
created_by_id                       str
center_code                     float64
police_station                      str
data_sent_to_scita                 bool
junction_name                       str
action_taken_timestamp          float64
data_sent_to_scita_timestamp        str
updated_vehicle_number              str
updated_vehicle_type                str
validation_status                   str
validation_timestamp                str
```

## Null counts (non-zero only)

```
description                     298450
closed_datetime                 298450
action_taken_timestamp          298450
data_sent_to_scita_timestamp    256289
updated_vehicle_number          125254
updated_vehicle_type            125254
validation_status               125254
validation_timestamp            125254
center_code                      11260
location                          3041
created_by_id                        5
police_station                       5
junction_name                        5
```

## Datetime range

- created_datetime min: 2023-11-09 19:11:46+00:00
- created_datetime max: 2024-04-08 17:30:46+00:00

## Violations by hour of day

```
created_datetime
0.0     21760
1.0     17155
2.0     24770
3.0     25707
4.0     29102
5.0     34085
6.0     26890
7.0     14608
8.0      8556
9.0      3145
10.0      518
11.0      577
12.0      219
13.0       56
14.0       16
15.0       66
16.0      416
17.0      818
18.0     1971
19.0    10713
20.0    11834
21.0    19763
22.0    22839
23.0    22861
```

## Violations by day of week (0=Mon)

```
created_datetime
0.0    38931
1.0    42929
2.0    43065
3.0    41528
4.0    41702
5.0    43427
6.0    46863
```

## Lat/Lng validation

- Null lat or lng: 0

- Within Bengaluru bbox {'lat_min': 12.7, 'lat_max': 13.2, 'lng_min': 77.3, 'lng_max': 77.8}: 298282 / 298450

- lat range observed: [12.8026667, 13.293684372967755]

- lng range observed: [77.442553, 77.771735]

## value_counts: violation_type

```
violation_type
["WRONG PARKING"]                                                      138764
["NO PARKING"]                                                         119576
["PARKING IN A MAIN ROAD","WRONG PARKING"]                               9472
["PARKING IN A MAIN ROAD","NO PARKING"]                                  4818
["WRONG PARKING","DEFECTIVE NUMBER PLATE"]                               3317
["NO PARKING","PARKING IN A MAIN ROAD"]                                  2449
["NO PARKING","DEFECTIVE NUMBER PLATE"]                                  2380
["WRONG PARKING","PARKING IN A MAIN ROAD"]                               1955
["PARKING ON FOOTPATH","WRONG PARKING"]                                  1190
["NO PARKING","WRONG PARKING"]                                            891
["PARKING IN A MAIN ROAD","WRONG PARKING","NO PARKING"]                   865
["WRONG PARKING","NO PARKING"]                                            827
["PARKING ON FOOTPATH","NO PARKING"]                                      682
["NO PARKING","WRONG PARKING","PARKING IN A MAIN ROAD"]                   675
["WRONG PARKING","PARKING ON FOOTPATH"]                                   466
["NO PARKING","PARKING NEAR BUSTOP/SCHOOL/HOSPITAL ETC"]                  389
["DEFECTIVE NUMBER PLATE","WRONG PARKING"]                                380
["NO PARKING","DOUBLE PARKING"]                                           367
["NO PARKING","PARKING ON FOOTPATH"]                                      344
["WRONG PARKING","REFUSE TO GO FOR HIRE"]                                 329
["PARKING NEAR ROAD CROSSING","WRONG PARKING"]                            310
["DEFECTIVE NUMBER PLATE","NO PARKING"]                                   293
["WRONG PARKING","NO PARKING","PARKING IN A MAIN ROAD"]                   272
["PARKING IN A MAIN ROAD","WRONG PARKING","DEFECTIVE NUMBER PLATE"]       261
["WRONG PARKING","PARKING NEAR BUSTOP/SCHOOL/HOSPITAL ETC"]               239
["PARKING NEAR BUSTOP/SCHOOL/HOSPITAL ETC","WRONG PARKING"]               238
["WRONG PARKING","DOUBLE PARKING"]                                        237
["PARKING NEAR BUSTOP/SCHOOL/HOSPITAL ETC","NO PARKING"]                  182
["PARKING OTHER THAN BUS STOP","WRONG PARKING"]                           181
["PARKING ON FOOTPATH","WRONG PARKING","NO PARKING"]                      177
```

## value_counts: junction_name

```
junction_name
No Junction                                       147880
BTP051 - Safina Plaza Junction                     15449
BTP082 - KR Market Junction                        11538
BTP040 - Elite Junction                            10718
BTP044 - Sagar Theatre Junction                    10549
BTP211 - Central Street Junction                    5388
BTP058 - Subbanna Junction                          5189
BTP027 - Modi Bridge Junction                       4584
BTP020 - Hosahalli Metro Station                    4101
BTP057 - Anand Rao Junction                         3935
BTP080 - NR Road, SP Road Junction                  3681
BTP045 - Danvanthri Road Junction                   3181
BTP001 - 10th Cross, Dr. Rajkumar Road              2812
BTP083 - AS Char Street, Mysore Road                2778
BTP032 - Windsor Circle                             2749
BTP016 - 5th Main Road, RPC Layout                  2474
BTP070 - Cholurpalya Junction, Magadi Road          2272
BTP042 - Minsk Square Junction (CTO)                2044
BTP038 - Mysore Bank Junction                       2021
BTP023 - Mahalaxmi Layout Entrance                  1807
BTP108 - Tagore Park Junction                       1801
BTP043 - Upparpet Junction                          1786
BTP048 - Shanthala Junction                         1593
BTP104 - Medical College Circle                     1508
BTP182 - 19th Main Junction, Rajajinagar            1390
BTP011 - RR Kalyana Mantapa, Dr. Rajkumar Road      1208
BTP008 - Navarang Theatre                           1190
BTP022 - Marenahalli Junction, Vijayanagar          1157
BTP135 - UCO Bank Junction                          1112
BTP026 - 1st Block Junction, Rajajinagar            1086
```

## value_counts: police_station

```
police_station
Upparpet                  34468
Shivajinagar              28044
Malleshwaram              22200
HAL Old Airport           20819
City Market               17646
Vijayanagara              14652
Rajajinagar               10998
Kodigehalli               10916
Magadi Road                8558
Jeevanbheemanagar          6736
K.R. Pura                  6546
Halasuru Gate              6294
Mahadevapura               6187
Chikkajala                 5834
HSR Layout                 5018
Bellandur                  4964
High ground                4951
Byatarayanapura            4555
Electronic City            4333
Pulikeshinagar(F.Town)     4136
Halasur                    4011
Jayanagara                 3813
Chamarajpet                3795
Banaswadi                  3759
Basavanagudi               3604
Ashok Nagar                3524
Adugodi                    3332
Cubbon Park                3255
Hebbala                    3209
Wilson Garden              3108
```

## value_counts: vehicle_type

```
vehicle_type
SCOOTER                94856
CAR                    88870
MOTOR CYCLE            40811
PASSENGER AUTO         37813
MAXI-CAB               11372
LGV                     8255
GOODS AUTO              2934
MOPED                   2199
PRIVATE BUS             1633
VAN                     1466
TEMPO                   1368
BUS (BMTC/KSRTC)        1281
HGV                     1144
LORRY/GOODS VEHICLE     1122
JEEP                     913
OTHERS                   895
TOURIST BUS              379
SCHOOL VEHICLE           378
TANKER                   260
FACTORY BUS              238
MINI LORRY               199
TRACTOR                   64
```

## value_counts: updated_vehicle_type

```
updated_vehicle_type
NaN                    125254
SCOOTER                 54867
CAR                     49936
MOTOR CYCLE             23533
PASSENGER AUTO          23007
MAXI-CAB                 7283
LGV                      4942
GOODS AUTO               1798
MOPED                    1080
PRIVATE BUS              1018
VAN                       882
BUS (BMTC/KSRTC)          792
LORRY/GOODS VEHICLE       723
HGV                       698
TEMPO                     684
JEEP                      568
OTHERS                    529
SCHOOL VEHICLE            237
TOURIST BUS               187
TANKER                    157
MINI LORRY                117
FACTORY BUS               113
TRACTOR                    45
```

## value_counts: validation_status

```
validation_status
NaN           125254
approved      115400
rejected       49754
created1        7044
processing       678
duplicate        320
```

## value_counts: data_sent_to_scita

```
data_sent_to_scita
True     255893
False     42557
```

## offence_code value_counts

```
offence_code
[112]            138764
[113]            119576
[107,112]          9472
[107,113]          4818
[112,116]          3317
[113,107]          2449
[113,116]          2380
[112,107]          1955
[105,112]          1190
[113,112]           891
[107,112,113]       865
[112,113]           827
[105,113]           682
[113,112,107]       675
[112,105]           466
[113,111]           389
[116,112]           380
[113,109]           367
[113,105]           344
[112,124]           329
[104,112]           310
[116,113]           293
[112,113,107]       272
[107,112,116]       261
[112,111]           239
[111,112]           238
[112,109]           237
[111,113]           182
[139,112]           181
[105,112,113]       177
```

## Mandatory filter impact

- validation_status == 'approved': 115400 / 298450

- data_sent_to_scita truthy: 255893 / 298450

- All 4 mandatory filters combined: 115347 / 298450 rows survive
