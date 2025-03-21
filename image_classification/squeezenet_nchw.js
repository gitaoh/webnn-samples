"use strict";

import { buildConstantByNpy, weightsOrigin } from "../common/utils.js";

// SqueezeNet 1.1 model with 'nchw' input layout
export class SqueezeNetNchw {
	constructor() {
		this.context_ = null;
		this.builder_ = null;
		this.graph_ = null;
		this.inputTensor_ = null;
		this.outputTensor_ = null;
		this.weightsUrl_ =
			weightsOrigin() + "/test-data/models/squeezenet1.1_nchw/weights/";
		this.inputOptions = {
			mean: [0.485, 0.456, 0.406],
			std: [0.229, 0.224, 0.225],
			norm: true,
			inputLayout: "nchw",
			labelUrl: "./labels/labels1000.txt",
			inputShape: [1, 3, 224, 224],
		};
		this.outputShape_ = [1, 1000];
	}

	async buildConv_(input, name, options = {}) {
		const prefix = this.weightsUrl_ + "squeezenet0_" + name;
		const weightsName = prefix + "_weight.npy";
		const weights = buildConstantByNpy(this.builder_, weightsName);
		const biasName = prefix + "_bias.npy";
		const bias = buildConstantByNpy(this.builder_, biasName);
		options.bias = await bias;
		const conv2d = this.builder_.conv2d(
			await input,
			await weights,
			options,
		);
		return this.builder_.relu(conv2d);
	}

	async buildFire_(input, convName, conv1x1Name, conv3x3Name) {
		const conv = this.buildConv_(input, convName);
		const conv1x1 = this.buildConv_(conv, conv1x1Name);
		const conv3x3 = this.buildConv_(conv, conv3x3Name, {
			padding: [1, 1, 1, 1],
		});
		return this.builder_.concat([await conv1x1, await conv3x3], 1);
	}

	async load(contextOptions) {
		this.context_ = await navigator.ml.createContext(contextOptions);
		this.builder_ = new MLGraphBuilder(this.context_);
		const inputDesc = {
			dataType: "float32",
			dimensions: this.inputOptions.inputShape,
			shape: this.inputOptions.inputShape,
		};
		const data = this.builder_.input("input", inputDesc);
		inputDesc.usage = MLTensorUsage.WRITE;
		inputDesc.writable = true;
		this.inputTensor_ = await this.context_.createTensor(inputDesc);
		this.outputTensor_ = await this.context_.createTensor({
			dataType: "float32",
			dimensions: this.outputShape_,
			shape: this.outputShape_,
			usage: MLTensorUsage.READ,
			readable: true,
		});
		const conv0 = this.buildConv_(data, "conv0", { strides: [2, 2] });
		const pool0 = this.builder_.maxPool2d(await conv0, {
			windowDimensions: [3, 3],
			strides: [2, 2],
		});
		const fire0 = this.buildFire_(pool0, "conv1", "conv2", "conv3");
		const fire1 = this.buildFire_(fire0, "conv4", "conv5", "conv6");
		const pool1 = this.builder_.maxPool2d(await fire1, {
			windowDimensions: [3, 3],
			strides: [2, 2],
		});
		const fire2 = this.buildFire_(pool1, "conv7", "conv8", "conv9");
		const fire3 = this.buildFire_(fire2, "conv10", "conv11", "conv12");
		const pool2 = this.builder_.maxPool2d(await fire3, {
			windowDimensions: [3, 3],
			strides: [2, 2],
		});
		const fire4 = this.buildFire_(pool2, "conv13", "conv14", "conv15");
		const fire5 = this.buildFire_(fire4, "conv16", "conv17", "conv18");
		const fire6 = this.buildFire_(fire5, "conv19", "conv20", "conv21");
		const fire7 = this.buildFire_(fire6, "conv22", "conv23", "conv24");
		const conv25 = this.buildConv_(fire7, "conv25");
		const pool3 = this.builder_.averagePool2d(await conv25, {
			windowDimensions: [13, 13],
			strides: [13, 13],
		});
		const reshape0 = this.builder_.reshape(pool3, [1, 1000]);
		return this.builder_.softmax(reshape0);
	}

	async build(outputOperand) {
		this.graph_ = await this.builder_.build({ output: outputOperand });
	}

	async compute(inputBuffer) {
		this.context_.writeTensor(this.inputTensor_, inputBuffer);
		const inputs = { input: this.inputTensor_ };
		const outputs = { output: this.outputTensor_ };
		this.context_.dispatch(this.graph_, inputs, outputs);
		const results = await this.context_.readTensor(this.outputTensor_);
		return new Float32Array(results);
	}
}
