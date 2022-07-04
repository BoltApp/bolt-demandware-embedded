docker-image:
	docker login
	# To do this, you first need to download the ZIP files via Github UI for:
	# https://github.com/SalesforceCommerceCloud/storefront-reference-architecture
	# https://github.com/SalesforceCommerceCloud/sfcc-ci/releases (linux version)
	cp ~/Downloads/storefront-reference-architecture-master.zip .
	cp ~/Downloads/sfcc-ci-linux .
	docker build -f .circleci/docker/Dockerfile . --tag $(tag)
	docker push $(tag)
	rm storefront-reference-architecture-master.zip
	rm sfcc-ci-linux
