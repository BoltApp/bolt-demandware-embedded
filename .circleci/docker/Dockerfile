FROM cimg/node:10.22

USER root
COPY sfcc-ci-linux .
RUN chmod +x ./sfcc-ci-linux
RUN sudo mv ./sfcc-ci-linux /usr/local/bin/sfcc-ci

USER circleci
WORKDIR /home/circleci
COPY storefront-reference-architecture-master.zip .
RUN unzip storefront-reference-architecture-master.zip && \
  mv storefront-reference-architecture-master storefront-reference-architecture && \
  cd storefront-reference-architecture && \
  npm install

RUN sfcc-ci --help

RUN rm -rf /home/circleci/project
