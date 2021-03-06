# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import os

from .. import metadata

from base import Step, StepRunner

class UpdateExpected(Step):
    """Do the metadata update on the local checkout"""

    provides = ["needs_human"]

    def create(self, state):
        if state.sync_tree is not None:
            sync_root = state.sync_tree.root
        else:
            sync_root = None

        state.needs_human = metadata.update_expected(state.paths,
                                                     state.serve_root,
                                                     state.run_log,
                                                     rev_old=None,
                                                     ignore_existing=state.ignore_existing,
                                                     sync_root=sync_root)


class CreateMetadataPatch(Step):
    """Create a patch/commit for the metadata checkout"""

    def create(self, state):
        if state.no_patch:
            return

        local_tree = state.local_tree
        sync_tree = state.sync_tree

        if sync_tree is not None:
            name = "web-platform-tests_update_%s_metadata" % sync_tree.rev
            message = "Update web-platform-tests expected data to revision %s" % sync_tree.rev
        else:
            name = "web-platform-tests_update_metadata"
            message = "Update web-platform-tests expected data"

        local_tree.create_patch(name, message)

        if not local_tree.is_clean:
            metadata_paths = [manifest_path["metadata_path"]
                              for manifest_path in state.paths.itervalues()]
            for path in metadata_paths:
                local_tree.add_new(os.path.relpath(path, local_tree.root))
            local_tree.update_patch(include=metadata_paths)
            local_tree.commit_patch()


class MetadataUpdateRunner(StepRunner):
    """(Sub)Runner for updating metadata"""
    steps = [UpdateExpected,
             CreateMetadataPatch]
