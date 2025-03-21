const context = await navigator.ml.createContext({
	powerPreference: "low-power",
});

// The following code builds a graph as:
// constant1 ---+
//              +--- Add ---> intermediateOutput1 ---+
// input1    ---+                                    |
//                                                   +--- Mul---> output
// constant2 ---+                                    |
//              +--- Add ---> intermediateOutput2 ---+
// input2    ---+

// Use tensors in 4 dimensions.
const TENSOR_DIMS = [1, 2, 2, 2];
const TENSOR_SIZE = 8;

const builder = new MLGraphBuilder(context);

// Create MLOperandDescriptor object.
const desc = {
	dataType: "float32",
	dimensions: TENSOR_DIMS,
	shape: TENSOR_DIMS,
};

// constant1 is a constant MLOperand with the value 0.5.
const constantBuffer1 = new Float32Array(TENSOR_SIZE).fill(0.5);
const constant1 = builder.constant(desc, constantBuffer1);

// input1 is one of the input MLOperands.
// Its value will be set before execution.
const input1 = builder.input("input1", desc);

// constant2 is another constant MLOperand with the value 0.5.
const constantBuffer2 = new Float32Array(TENSOR_SIZE).fill(0.5);
const constant2 = builder.constant(desc, constantBuffer2);

// input2 is another input MLOperand. Its value will be set before execution.
const input2 = builder.input("input2", desc);

// intermediateOutput1 is the output of the first Add operation.
const intermediateOutput1 = builder.add(constant1, input1);

// intermediateOutput2 is the output of the second Add operation.
const intermediateOutput2 = builder.add(constant2, input2);

// output is the output MLOperand of the Mul operation.
const output = builder.mul(intermediateOutput1, intermediateOutput2);

// Compile the constructed graph.
const graph = await builder.build({ output: output });

// Setup the input buffers with value 1.
const inputBuffer1 = new Float32Array(TENSOR_SIZE).fill(1);
const inputBuffer2 = new Float32Array(TENSOR_SIZE).fill(1);

desc.usage = MLTensorUsage.WRITE;
desc.writable = true;
const inputTensor1 = await context.createTensor(desc);
const inputTensor2 = await context.createTensor(desc);
context.writeTensor(inputTensor1, inputBuffer1);
context.writeTensor(inputTensor2, inputBuffer2);

const outputTensor = await context.createTensor({
	...desc,
	usage: MLTensorUsage.READ,
	readable: true,
	writable: false,
});

// Execute the compiled graph with the specified inputs.
const inputs = {
	input1: inputTensor1,
	input2: inputTensor2,
};
const outputs = { output: outputTensor };
context.dispatch(graph, inputs, outputs);

const results = await context.readTensor(outputTensor);
console.log("Output value: " + new Float32Array(results));
// Output value: 2.25,2.25,2.25,2.25,2.25,2.25,2.25,2.25
