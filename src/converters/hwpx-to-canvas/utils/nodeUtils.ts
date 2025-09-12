/**
 * 노드 탐색 및 조작 유틸리티 함수
 */

import { IHWPXNode as HWPXNode } from '../types'

/**
 * 특정 태그를 가진 모든 노드 찾기 (재귀적)
 */
export function findNodesByTag(node: HWPXNode, tag: string): HWPXNode[] {
  const results: HWPXNode[] = []
  
  if (node.tag === tag) {
    results.push(node)
  }
  
  if (node.children?.length) {
    for (const child of node.children) {
      results.push(...findNodesByTag(child, tag))
    }
  }
  
  return results
}

/**
 * 특정 속성을 가진 첫 번째 노드 찾기
 */
export function findNodeByAttribute(
  node: HWPXNode,
  attrName: string,
  attrValue?: string
): HWPXNode | null {
  const attrs = node.attributes || node.attrs
  
  if (attrs) {
    if (attrValue === undefined) {
      // 속성이 존재하는지만 체크
      if (attrName in attrs) {
        return node
      }
    } else {
      // 속성값도 체크
      if (attrs[attrName] === attrValue) {
        return node
      }
    }
  }
  
  if (node.children?.length) {
    for (const child of node.children) {
      const found = findNodeByAttribute(child, attrName, attrValue)
      if (found) return found
    }
  }
  
  return null
}

/**
 * 노드의 모든 텍스트 추출 (재귀적)
 */
export function extractAllText(node: HWPXNode): string {
  let text = ''
  
  if (node.text) {
    text += node.text
  }
  
  if (node.children?.length) {
    for (const child of node.children) {
      text += extractAllText(child)
    }
  }
  
  return text
}

/**
 * 노드 경로 가져오기 (루트부터 현재 노드까지)
 */
export function getNodePath(root: HWPXNode, target: HWPXNode): string[] {
  const path: string[] = []
  
  function findPath(node: HWPXNode, currentPath: string[]): boolean {
    if (node === target) {
      path.push(...currentPath, node.tag)
      return true
    }
    
    if (node.children?.length) {
      for (const child of node.children) {
        if (findPath(child, [...currentPath, node.tag])) {
          return true
        }
      }
    }
    
    return false
  }
  
  findPath(root, [])
  return path
}

/**
 * 노드의 부모 찾기
 */
export function findParentNode(root: HWPXNode, target: HWPXNode): HWPXNode | null {
  if (root.children?.length) {
    for (const child of root.children) {
      if (child === target) {
        return root
      }
      
      const parent = findParentNode(child, target)
      if (parent) return parent
    }
  }
  
  return null
}

/**
 * 노드의 형제 노드들 가져오기
 */
export function getSiblingNodes(root: HWPXNode, target: HWPXNode): HWPXNode[] {
  const parent = findParentNode(root, target)
  
  if (parent && parent.children) {
    return parent.children.filter(child => child !== target)
  }
  
  return []
}

/**
 * 노드 복사 (깊은 복사)
 */
export function cloneNode(node: HWPXNode): HWPXNode {
  const clone: HWPXNode = {
    tag: node.tag
  }
  
  if (node.namespace) clone.namespace = node.namespace
  if (node.attributes) clone.attributes = { ...node.attributes }
  if (node.attrs) clone.attrs = { ...node.attrs }
  if (node.text !== undefined) clone.text = node.text
  
  if (node.children?.length) {
    clone.children = node.children.map(child => cloneNode(child))
  }
  
  return clone
}

/**
 * 노드가 특정 태그의 자손인지 확인
 */
export function isDescendantOf(root: HWPXNode, target: HWPXNode, ancestorTag: string): boolean {
  let current = findParentNode(root, target)
  
  while (current) {
    if (current.tag === ancestorTag) {
      return true
    }
    current = findParentNode(root, current)
  }
  
  return false
}

/**
 * 노드의 깊이 계산 (루트로부터)
 */
export function getNodeDepth(root: HWPXNode, target: HWPXNode): number {
  let depth = 0
  let current = findParentNode(root, target)
  
  while (current) {
    depth++
    current = findParentNode(root, current)
  }
  
  return depth
}

/**
 * 특정 조건을 만족하는 노드 필터링
 */
export function filterNodes(
  node: HWPXNode,
  predicate: (node: HWPXNode) => boolean
): HWPXNode[] {
  const results: HWPXNode[] = []
  
  if (predicate(node)) {
    results.push(node)
  }
  
  if (node.children?.length) {
    for (const child of node.children) {
      results.push(...filterNodes(child, predicate))
    }
  }
  
  return results
}