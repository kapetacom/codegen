## [1.3.1](https://github.com/kapetacom/codegen/compare/v1.3.0...v1.3.1) (2024-03-19)


### Bug Fixes

* attempt merge w/ existing files in fresh repo [CORE-2084] ([#14](https://github.com/kapetacom/codegen/issues/14)) ([b27449e](https://github.com/kapetacom/codegen/commit/b27449e98b798a91d787d5efb4db009508290ef7))

# [1.3.0](https://github.com/kapetacom/codegen/compare/v1.2.1...v1.3.0) (2024-02-14)


### Features

* Add support for buffers (and native files) ([#13](https://github.com/kapetacom/codegen/issues/13)) ([fcf5c79](https://github.com/kapetacom/codegen/commit/fcf5c79cb69374d2d441774c68653b641726343b))

## [1.2.1](https://github.com/kapetacom/codegen/compare/v1.2.0...v1.2.1) (2023-12-30)


### Bug Fixes

* Avoid lots of empty dirs and asset merge cache files gets created ([#12](https://github.com/kapetacom/codegen/issues/12)) ([95cad45](https://github.com/kapetacom/codegen/commit/95cad45e8b66a23e5c962bc865310f4820b43014))

# [1.2.0](https://github.com/kapetacom/codegen/compare/v1.1.2...v1.2.0) (2023-12-30)


### Features

* Add merge cache to be able to compare to previously generated files ([#11](https://github.com/kapetacom/codegen/issues/11)) ([3d05f5b](https://github.com/kapetacom/codegen/commit/3d05f5bf1281e51c9ac9eb464a8ab46dd003805c))

## [1.1.2](https://github.com/kapetacom/codegen/compare/v1.1.1...v1.1.2) (2023-11-15)

### Bug Fixes

-   Parse kinds correctly ([#10](https://github.com/kapetacom/codegen/issues/10)) ([e2a2443](https://github.com/kapetacom/codegen/commit/e2a24432d8d7aafc92992aeaac675a30ed1ed123))

## [1.1.1](https://github.com/kapetacom/codegen/compare/v1.1.0...v1.1.1) (2023-09-20)

### Bug Fixes

-   Clean up empty folders when updating generated code ([#8](https://github.com/kapetacom/codegen/issues/8)) ([8dec127](https://github.com/kapetacom/codegen/commit/8dec12747d5d0b68745297361e178a1c336288b2))

# [1.1.0](https://github.com/kapetacom/codegen/compare/v1.0.1...v1.1.0) (2023-06-27)

### Features

-   Added postprocessing for specific target ([a152983](https://github.com/kapetacom/codegen/commit/a1529832fe8e7e7bcbd32c0e1fccdd1b2a2844d5))

## [1.0.1](https://github.com/kapetacom/codegen/compare/v1.0.0...v1.0.1) (2023-06-19)

### Bug Fixes

-   Avoid overwriting previously merged assets ([#7](https://github.com/kapetacom/codegen/issues/7)) ([89f21ff](https://github.com/kapetacom/codegen/commit/89f21fff183711388fef46b8dfcd80b7fee2960a))

# 1.0.0 (2023-06-18)

-   feat!: Add merge capability to targets (#6) ([a4a0cae](https://github.com/kapetacom/codegen/commit/a4a0cae738a0cbf1e4290fcdc46d7d0ddf800928)), closes [#6](https://github.com/kapetacom/codegen/issues/6)

### BREAKING CHANGES

-   Rewrote to fully TS with CJS and ESM
