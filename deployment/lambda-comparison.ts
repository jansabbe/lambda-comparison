#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { LambdaComparisonStack } from './lib/lambda-comparison-stack';

const app = new cdk.App();
new LambdaComparisonStack(app, 'LambdaComparisonStack');
