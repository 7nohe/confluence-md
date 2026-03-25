/**
 * Table-related node handlers
 */

import type { Html, Table, TableCell, TableRow } from 'mdast';
import type { Parent } from 'unist';
import { createElement } from '../xml';
import type { MdastNode, NodeHandler } from './types';

/**
 * Handle table nodes
 */
export const tableHandler: NodeHandler = (node, state) => {
	const table = node as unknown as Table;

	if (!table.children || table.children.length === 0) {
		return '';
	}

	const rows = table.children as TableRow[];
	let content = '';

	// First row is header
	if (rows.length > 0) {
		content += '<thead>';
		content += convertTableRow(rows[0], state, true);
		content += '</thead>';
	}

	// Remaining rows are body
	if (rows.length > 1) {
		content += '<tbody>';
		for (let i = 1; i < rows.length; i++) {
			content += convertTableRow(rows[i], state, false);
		}
		content += '</tbody>';
	}

	return createElement('table', undefined, content);
};

/**
 * Handle table row nodes (standalone, without header context)
 */
export const tableRowHandler: NodeHandler = (node, state) => {
	return convertTableRow(node as unknown as TableRow, state, false);
};

/**
 * Handle table cell nodes (standalone, without header context)
 */
export const tableCellHandler: NodeHandler = (node, state) => {
	return convertTableCell(node as unknown as TableCell, state, false);
};

/**
 * Internal: Convert a table row with header context
 */
function convertTableRow(
	node: TableRow,
	state: {
		convertChildren: (parent: Parent) => string;
		convertNode: (node: MdastNode) => string;
	},
	isHeader: boolean
): string {
	const cells = (node.children || [])
		.map((cell) => convertTableCell(cell as TableCell, state, isHeader))
		.join('');
	return createElement('tr', undefined, cells);
}

/**
 * Internal: Convert a table cell with header context
 */
function convertTableCell(
	node: TableCell,
	state: {
		convertChildren: (parent: Parent) => string;
		convertNode: (node: MdastNode) => string;
	},
	isHeader: boolean
): string {
	const tag = isHeader ? 'th' : 'td';
	return createElement(tag, undefined, convertTableCellChildren(node, state));
}

function convertTableCellChildren(
	node: TableCell,
	state: { convertChildren: (parent: Parent) => string; convertNode: (node: MdastNode) => string }
): string {
	if (!node.children || node.children.length === 0) {
		return state.convertChildren(node as unknown as Parent);
	}

	return node.children
		.map((child) => {
			if (child.type === 'html') {
				return convertTableCellHtml(child as Html);
			}

			return state.convertNode(child as MdastNode);
		})
		.join('');
}

function convertTableCellHtml(node: Html): string {
	const value = node.value.trim().toLowerCase();
	return value === '<br>' || value === '<br/>' ? '<br/>' : '';
}
