import {POTreeNode} from "@loaders.gl/potree";

export class PotreeTraverser {
    root?: POTreeNode;
    nodesToLoad: POTreeNode[] = [];

    traverse(viewports: {id: string}[]) {
        if (!this.root) {
            return [];
        }
        const viewportIds = viewports.map(item => item.id);

        this.nodesToLoad = [];
        const result: POTreeNode[] = [];
        const stack: POTreeNode[] = [this.root];

        while (stack.length > 0) {
            const node = stack.pop();

            if (!node) {
                // eslint-disable-next-line no-continue
                continue;
            }

            for (const child of node?.children ?? []) {
                stack.push(child);
            }
            node.selected = true;
            node.viewportIds = viewportIds;
            result.push(node);
            if (!node.content && !node.isContentLoading) {
                this.nodesToLoad.push(node);
            }
        }
        return result;
    }
}