/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
 #include <fbjni/fbjni.h>
#include "MainApplicationTurboModuleManagerDelegate.h"
#include "MainComponentsRegistry.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::MainApplicationTurboModuleManagerDelegate::
        registerNatives();
    facebook::react::MainComponentsRegistry::registerNatives();
  });
}
