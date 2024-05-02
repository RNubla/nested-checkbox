import { DevTool } from "@hookform/devtools";
import type React from "react";
import { type FC, useState } from "react";
import { Control, Controller, FieldValues, useForm } from "react-hook-form";
// import { cloneDeep } from "lodash";

type NestedCheckboxData = {
	[key: string]: boolean | NestedCheckboxData;
};
interface Node {
	label: string;
	checked: boolean;
	childrenNodes: Node[];
	parent?: Node;
}
const dataOne: NestedCheckboxData = {
	foo: true,
	bar: false,
	foobar: {
		hello: true,
		hi: false,
		greetings: {
			tom: false,
			world: {
				hello: false,
			},
		},
	},
};
const transform = (data: NestedCheckboxData, parent?: Node) => {
	return Object.keys(data).map((key) => {
		const value = data[key];
		const node: Node = {
			label: key,
			checked: false,
			childrenNodes: [],
			parent: parent,
		};

		if (typeof value === "boolean") {
			node.checked = value;
		} else {
			const children = transform(value, node);
			node.childrenNodes = children;
			if (children.every((node) => node.checked)) {
				node.checked = true;
			}
		}

		return node;
	});
};

const updateAncestors = (node: Node) => {
	// if node.parent is undefined
	if (!node.parent) {
		return;
	}

	const parent = node.parent;
	if (parent.checked && !node.checked) {
		if (parent.childrenNodes.some((node) => node.checked)) {
			// parent.checked = true;
			return;
		}
		parent.checked = false;
		updateAncestors(parent);
		return;
	}

	if (!parent.checked && node.checked) {
		if (parent.childrenNodes.some((node) => node.checked)) {
			parent.checked = true;
			updateAncestors(parent);
			return;
		}
	}

	return;
};

const toggleDescendants = (node: Node) => {
	const checked = node.checked;

	// for (const _node of node.childrenNodes) {
	// 	node.checked = checked;
	// 	toggleDescendants(_node);
	// }

	if (!checked) {
		// biome-ignore lint/complexity/noForEach: <explanation>
		node.childrenNodes.forEach((node) => {
			node.checked = checked;
			toggleDescendants(node);
		});
	}
};

const findNode = (nodes: Node[], label: string, ancestors: string[]) => {
	let node = undefined as unknown as Node;
	if (ancestors.length === 0) {
		return nodes.filter((node) => node.label === label)[0];
	}

	for (const ancestor of ancestors) {
		const candidates = node ? node.childrenNodes : nodes;
		node = candidates.filter((node) => node.label === ancestor)[0];
	}
	return node?.childrenNodes.filter((node) => node.label === label)[0];
};

interface NestedCheckboxProps {
	data: NestedCheckboxData;
	ancestors?: string[];
	control: Control<FieldValues, any>;
}

const NestedCheckbox: FC<NestedCheckboxProps> = ({ data, control }) => {
	const initialNodes = transform(data);
	const [nodes, setNodes] = useState(initialNodes);

	const handleBoxChecked = (e, ancestors: string[]) => {
		const checked = e.currentTarget.checked;
		const node = findNode(nodes, e.currentTarget.value, ancestors);

		node.checked = checked;
		toggleDescendants(node);
		updateAncestors(node);

		// setNodes(cloneDeep(nodes));
		setNodes(structuredClone(nodes));
	};

	return (
		<NestedCheckboxHelper
			control={control}
			nodes={nodes}
			ancestors={[]}
			onBoxChecked={handleBoxChecked}
		/>
	);
};

interface NestedCheckboxHelperProps {
	control: Control<FieldValues, any>;
	nodes: Node[];
	ancestors: string[];
	onBoxChecked: (
		event: React.ChangeEvent<HTMLInputElement>,
		string: [],
	) => void;
}
const NestedCheckboxHelper: FC<NestedCheckboxHelperProps> = ({
	control,
	nodes,
	ancestors,
	onBoxChecked,
}) => {
	const prefix = ancestors.join(".");
	return (
		<ul>
			{nodes.map(({ label, checked, childrenNodes }) => {
				const id = `${prefix}.${label}`;
				let children = null;
				// if (childrenNodes.length > 0) {
				// 	<Controller
				// 		control={control}
				// 		name={id}
				// 		render={({ field, fieldState }) => {
				// 			children = (
				// 				<NestedCheckboxHelper
				// 					control={control}
				// 					nodes={childrenNodes}
				// 					ancestors={[...ancestors, label]}
				// 					onBoxChecked={onBoxChecked}
				// 				/>
				// 			);
				// 			return children;
				// 		}}
				// 	/>;
				// }
				// console.log(id);
				if (childrenNodes.length > 0) {
					children = (
						<NestedCheckboxHelper
							control={control}
							nodes={childrenNodes}
							ancestors={[...ancestors, label]}
							onBoxChecked={onBoxChecked}
						/>
					);
				}

				return (
					<Controller
						key={id}
						control={control}
						render={({ field, fieldState }) => {
							return (
								<li key={id}>
									<input
										type="checkbox"
										name={id}
										value={label}
										checked={checked}
										onChange={(e) => onBoxChecked(e, ancestors)}
									/>
									<label htmlFor={id}>{label}</label>
									{children}
								</li>
							);
						}}
						name={id}
					/>
					// <li key={id}>
					// 	<input
					// 		type="checkbox"
					// 		name={id}
					// 		value={label}
					// 		checked={checked}
					// 		onChange={(e) => onBoxChecked(e, ancestors)}
					// 	/>
					// 	<label htmlFor={id}>{label}</label>
					// 	{children}
					// </li>
				);
			})}
		</ul>
	);
};

function App() {
	const { control } = useForm({});
	return (
		<>
			<form>
				<NestedCheckbox control={control} data={dataOne} ancestors={[]} />;
			</form>
			<DevTool control={control} /> {/* set up the dev tool */}
		</>
	);
}
export default App;

// Log to console
// console.log("Hello console");
