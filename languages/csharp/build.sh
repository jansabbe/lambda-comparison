#!/bin/sh

dotnet restore
dotnet lambda package -c Release