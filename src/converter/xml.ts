/**
 * XML utility functions for Confluence storage format
 */

const XML_ENTITIES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&apos;',
};

/**
 * Escape special XML characters in text content
 */
export function escapeXml(text: string): string {
	return text.replace(/[&<>"']/g, (char) => XML_ENTITIES[char] || char);
}

/**
 * Escape special XML characters in attribute values
 */
export function escapeAttribute(value: string): string {
	return escapeXml(value);
}

/**
 * Wrap content in CDATA section for use in macro bodies
 * Handles nested CDATA by splitting ]]> sequences
 */
export function wrapCData(content: string): string {
	// Handle nested CDATA by escaping ]]> sequences
	const escaped = content.replace(/\]\]>/g, ']]]]><![CDATA[>');
	return `<![CDATA[${escaped}]]>`;
}

/**
 * Create an XML element with optional attributes and content
 */
export function createElement(
	tag: string,
	attributes?: Record<string, string>,
	content?: string
): string {
	const attrString = attributes
		? Object.entries(attributes)
				.map(([key, value]) => ` ${key}="${escapeAttribute(value)}"`)
				.join('')
		: '';

	if (content === undefined || content === '') {
		return `<${tag}${attrString}/>`;
	}

	return `<${tag}${attrString}>${content}</${tag}>`;
}

/**
 * Create a Confluence structured macro element
 */
export function createMacro(
	name: string,
	parameters?: Record<string, string>,
	body?: string,
	bodyType: 'plain-text' | 'rich-text' = 'plain-text'
): string {
	let content = '';

	if (parameters) {
		for (const [key, value] of Object.entries(parameters)) {
			content += `<ac:parameter ac:name="${escapeAttribute(key)}">${escapeXml(value)}</ac:parameter>`;
		}
	}

	if (body !== undefined) {
		const bodyTag = bodyType === 'plain-text' ? 'ac:plain-text-body' : 'ac:rich-text-body';
		const bodyContent = bodyType === 'plain-text' ? wrapCData(body) : body;
		content += `<${bodyTag}>${bodyContent}</${bodyTag}>`;
	}

	return `<ac:structured-macro ac:name="${escapeAttribute(name)}">${content}</ac:structured-macro>`;
}

/**
 * Create a Confluence image element
 */
export function createImage(
	source: { type: 'attachment'; filename: string } | { type: 'url'; url: string },
	alt?: string,
	title?: string
): string {
	let riElement: string;

	if (source.type === 'attachment') {
		riElement = `<ri:attachment ri:filename="${escapeAttribute(source.filename)}"/>`;
	} else {
		riElement = `<ri:url ri:value="${escapeAttribute(source.url)}"/>`;
	}

	const attributes: string[] = [];
	if (alt) {
		attributes.push(`ac:alt="${escapeAttribute(alt)}"`);
	}
	if (title) {
		attributes.push(`ac:title="${escapeAttribute(title)}"`);
	}

	const attrString = attributes.length > 0 ? ` ${attributes.join(' ')}` : '';

	return `<ac:image${attrString}>${riElement}</ac:image>`;
}
