import NodeFetchResponse from './response.node';

export default function fetchNode(url, options) {
  return new NodeFetchResponse(url, options);
}
