# Actifai Engineering Takehome

## Introduction

You are an Actifai backend engineer managing a database of our users - who are call center agents - and the sales that
the users place using our application.

The database has 4 tables:

- `users`: who are the users (name, role)
- `groups`: groups of users
- `user_groups`: which users belong to which groups
- `sales`: who made a sale, for how much, and when was it made

The front-end team has decided to build an analytics and reporting dashboard to display information about performance
to our users. They are interested in tracking which users and groups are performing well (in terms of their sales). The
primary metric they have specified as a requirement is average revenue and total revenue by user and group, for a given
month.

Your job is to build the API that will deliver data to this dashboard. In addition to the stated requirements above, we
would like to see you think about what additional data/metrics would be useful to add.

At a minimum, write one endpoint that returns time series data for user sales i.e. a list of rows, where each row
corresponds to a time window and information about sales. When you design the endpoint, think  about what query
parameters and options you want to support, to allow flexibility for the front-end team.

## Codebase

This repository contains a bare-bones Node/Express server, which is defined in `server.js`. This file is where you will
define your endpoints.

## Getting started

1. Install Docker (if you don't already have it)
2. Run `npm i` to install dependencies
3. Run `docker-compose up` to compile and run the images.
4. You now have a database and server running on your machine. You can test it by navigating to `http://localhost:3000/health` in
your browser. You should see a "Hello World" message.


## Help

If you have any questions, feel free to reach out to your interview scheduler for clarification!

# Submission

## Endpoints
All endpoints use the host url `http://localhost:3000/`, so I'll use that as the base for the endpoints below.

### Time Series Data
These endpoints all return data in largely the same format: the total revenue for the month, the number of sales, and the average (total revenue per sale).  
However, each endpoint incorporates a number of ways to specify what data should be included from the database.  Some fields common across all endpoints are:
- `fromYear`, `fromMonth`, `toYear`, `toMonth`: these specify the range of months to query for.  Note that these are required to call the endpoints, and must be in YYYY or MM format.
- `sortBy`: the data returned can be sorted on of the fields returned.  This includes: "month", "totalSaleRevenue", "numberOfSales", "averageRevenueBySales" (not case senstive).  
- `sortDirection`: supports `sortBy`, and can be either "DESC" or "ASC" (also not case sensitive).

More details are below.

`.../revenue/byUser/{userId}?fromYear={YYYY}&toYear={YYYY}&fromMonth={MM}&toMonth={MM}&sortBy={field}&sortDirection={DESC/ASC}`  
i.e. `http://localhost:3000/revenue/byUser/{userId}?fromYear=2021&toYear=2024&fromMonth=01&toMonth=01&sortBy=month&sortDirection=ASC`  
This endpoint returns the data for a single user, across the time span specified.

`.../revenue?fromYear={YYYY}&toYear={YYYY}&fromMonth={MM}&toMonth={MM}&sortBy={field}&sortDirection={DESC/ASC}&groupId={groupId}&role={role}&getUserInfo={getUserInfo}`  
i.e. `http://localhost:3000/revenue?fromYear=2021&toYear=2021&fromMonth=01&toMonth=09&sortBy=averagerevenuebysales&sortDirection=asc&groupId=2&role=Admin&groupId=2&getUserInfo=false`  
This endpoint returns data aggregated from a selection of users.  By default, this will include all users in the database, but can be filtered to any group or role with the parameters (or a combination of both).  
Some query parameters this introduces:
- `groupId`: a group id to filer on.  If this is included, we will only use data from users in this group.
- `role`: a role id to filter on (case senstive).  Same as above, if included, we will only use data from users with this role.
- `getUserInfo`: this boolean parameter will trigger our api to return data specific to each user's monthly trends in addition to the monthly data.  Aka, if the data is pulling from users Alice and Bob for the month of January, we would return January's report aggregated from those users as normal, but also individual January reports from Alice and Bob.  The input for this field is "true" (not case sensitive).

`.../revenue?fromYear={YYYY}&toYear={YYYY}&fromMonth={MM}&toMonth={MM}&sortBy={field}&sortDirection={DESC/ASC}&getUserInfo={getUserInfo}`  
Body: `{ "groupIds": [], "roles": [] }`  
i.e. `http://localhost:3000/revenue?fromYear=2021&toYear=2021&fromMonth=01&toMonth=09&sortBy=averagerevenuebysales&sortDirection=asc&getUserInfo=true`  
Body: `{ "groupIds": [1, 2], "roles": ["Admin"] }`  
This endpoint is the same as above, except the group and role parameters are instead within the body of the request.  This allows multiple groups and roles to be specified.

### Other endpoints
I've also added some other endpoints to allow for data manipulation.  These are mostly standard, so I'll keep details to a minimum here.

Sales:
- GET `.../sales/{id}`
- GET `.../sales/forUser/{userId}?limit={limit}` - retrieves a user's sales data, up to a limit - the default limit is 10 records, max limit is 50.
- POST `.../sales`
- DELETE `.../sales/{id}`

Users:
- GET `.../user/{id}`
- POST `.../user`
- DELETE `.../user/{id}?fullDelete=${bool}` - we won't allow a deletion if the user has existing sales, but if the `fullDelete` parameter is set to true, we'll delete these sales and the user.
- PATCH `.../user/{id}` - can edit a user, or move them to a different group.

Groups:
- GET `.../group/{id}`
- POST `.../group`
- DELETE `.../group/{id}` - we won't allow a deletion if the group has existing users.
