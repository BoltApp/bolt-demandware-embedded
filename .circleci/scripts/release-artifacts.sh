#!/usr/bin/env bash
GIT_TAG=$1

go get github.com/tcnksm/ghr
ghr -t "${GITHUBTOKEN}" -u "${CIRCLE_PROJECT_USERNAME}" -r "${CIRCLE_PROJECT_REPONAME}" -n "Version $GIT_TAG" -body "This release is version $GIT_TAG" -debug "$GIT_TAG" "../artifacts/$GIT_TAG-f21.zip"
ghr -t "${GITHUBTOKEN}" -u "${CIRCLE_PROJECT_USERNAME}" -r "${CIRCLE_PROJECT_REPONAME}" -n "Version $GIT_TAG" -body "This release is version $GIT_TAG" -debug "$GIT_TAG" "../artifacts/$GIT_TAG-lucky.zip"
ghr -t "${GITHUBTOKEN}" -u "${CIRCLE_PROJECT_USERNAME}" -r "${CIRCLE_PROJECT_REPONAME}" -n "Version $GIT_TAG" -body "This release is version $GIT_TAG" -debug "$GIT_TAG" "../artifacts/$GIT_TAG-brooks.zip"
ghr -t "${GITHUBTOKEN}" -u "${CIRCLE_PROJECT_USERNAME}" -r "${CIRCLE_PROJECT_REPONAME}" -n "Version $GIT_TAG" -body "This release is version $GIT_TAG" -debug "$GIT_TAG" "../artifacts/$GIT_TAG-core.zip"

# upload the diff files, if they exist
for filename in ../artifacts/*.txt; do
    if test -f "$filename"; then 
        ghr -t "${GITHUBTOKEN}" -u "${CIRCLE_PROJECT_USERNAME}" -r "${CIRCLE_PROJECT_REPONAME}" -n "Version $GIT_TAG" -body "This release is version $GIT_TAG" -debug "$GIT_TAG" "${filename}"
    fi
done
