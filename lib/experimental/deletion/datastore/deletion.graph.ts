/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  BaseModel,
  ModelClass,
  ModelUtil,
  SchemaMeta,
  DeleteCondition,
  DeleteTrigger,
} from '../../../data/pads/model';
import registry from '../../../data/pads/registry';
import {
  isArrayType,
  isJsModelType,
  isModelRefType,
} from '../../../data/pads/schema';

export type DeletionGraph = {
  version?: string;
  edges: Record<string, DeletionGraphEdge[]>;
};

export type DeletionGraphEdge = {
  modelName: string;
  field: string;
  trigger: DeleteTrigger;
  condition: DeleteCondition;
};

function edge<T extends BaseModel>(
  model: ModelClass<T>,
  field: string,
  trigger: DeleteTrigger,
  condition: DeleteCondition,
): DeletionGraphEdge {
  return {
    modelName: ModelUtil.getName(model),
    field,
    trigger,
    condition,
  };
}

let _graph: DeletionGraph;

export function getGraph() {
  if (!_graph) buildGraph();
  return _graph;
}

export function buildGraph(...argModels: ModelClass<any>[]): DeletionGraph {
  const graph: DeletionGraph = {
    // TODO
    // version: '0.0.0',
    edges: {},
  };

  const models = argModels?.length > 0 ? argModels : registry.getAllModels();

  for (const model of models) {
    const deleteRules = ModelUtil.getDeletionRules(model.prototype);
    if (!deleteRules) continue;

    for (const rule of deleteRules) {
      // TODO: validate rules
      if (rule.trigger === 'OUTNODE') {
        const pModel = getOutNodeModel(model, rule.field);
        const pName = ModelUtil.getName(pModel);
        if (!graph.edges[pName]) {
          graph.edges[pName] = [];
        }
        graph.edges[pName].push(
          edge(model, rule.field, rule.trigger, rule.condition),
        );
      }
      if (rule.trigger === 'INNODE') {
        const cModel = getInNodeModel(model, rule.model, rule.field);
        const cName = ModelUtil.getName(cModel);
        if (!graph.edges[cName]) {
          graph.edges[cName] = [];
        }
        graph.edges[cName].push(
          edge(model, rule.field, rule.trigger, rule.condition),
        );
      }
    }
  }

  _graph = graph;
  return graph;
}

function getOutNodeModel<T extends BaseModel, M extends BaseModel>(
  mClass: ModelClass<T>,
  field: string,
): ModelClass<M> {
  const schema: SchemaMeta = ModelUtil.getSchema(mClass);
  const type = schema[field]?.type;
  if (!type) {
    throw Error(
      `Invalid deletion rule: "${ModelUtil.getName(
        mClass,
      )}.${field}" is not part of model schema`,
    );
  }
  const isArray = isArrayType(type);
  // @ts-ignore
  const elemType = isArray ? type.getElementType() : type;

  if (!isModelRefType(elemType)) {
    throw Error(
      `Invalid deletion rule: "${ModelUtil.getName(
        mClass,
      )}.${field}" is not a Model Ref type`,
    );
  }

  return elemType.getModelClass();
}

function getInNodeModel<T extends BaseModel, M extends BaseModel>(
  mClass: ModelClass<T>,
  inNodeModelOrFn: ModelClass<M> | (() => ModelClass<M>),
  field: string,
): ModelClass<M> {
  const inNodeModel = isJsModelType(inNodeModelOrFn)
    ? inNodeModelOrFn
    : // @ts-ignore
      inNodeModelOrFn();
  const schema: SchemaMeta = ModelUtil.getSchema(inNodeModel);
  const type = schema[field]?.type;
  if (!type) {
    throw Error(
      `Invalid deletion rule: "${ModelUtil.getName(
        inNodeModel,
      )}.${field}" is not part of model schema`,
    );
  }
  const isArray = isArrayType(type);
  // @ts-ignore
  const elemType = isArray ? type.getElementType() : type;
  if (!isModelRefType(elemType)) {
    throw Error(
      `Invalid deletion rule: "${ModelUtil.getName(
        mClass,
      )}.${field}" is not a Model Ref type`,
    );
  }
  const elemModelClass = elemType.getModelClass();
  if (elemModelClass != mClass) {
    throw Error(
      `Invalid deletion rule: "${ModelUtil.getName(
        elemModelClass,
      )}.${field}" does not match ${ModelUtil.getName(mClass)}`,
    );
  }

  return inNodeModel;
}
