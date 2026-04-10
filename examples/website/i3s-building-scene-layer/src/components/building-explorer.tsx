import React from 'react';
import styled from 'styled-components';
import {Font, Color} from './styles';
import {Checkbox, CheckboxOption, CheckboxSpan} from './checkbox';
import {faAngleDown, faAngleRight, faCircle} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {IconProp, SizeProp} from '@fortawesome/fontawesome-svg-core';
import {Sublayer} from '../helpers/sublayers';
import {DropDown} from './drop-down';

const BuildingExplorerContainer = styled.div`
  max-height: 100%;
  width: 246px;
  overflow: auto;
  align-items: flex-start;
  position: absolute;
  display: flex;
  flex-direction: column;
  background: #0e111a;
  border-radius: 8px;
  padding-top: 8px;
`;

const BuildingExplorerSublayers = styled.div`
  display: flex;
  flex-direction: column;
`;

const CollapseContainer = styled.div`
  margin-right: 5px;
  cursor: pointer;
`;

const CheckboxContainer = styled.div`
  ${Color}
  ${Font}
  margin-left: 10px;
`;

const Label = styled.h3`
  margin: 0 16px 8px 16px;
  cursor: pointer;
  color: white;
  font-weight: normal;
`;

const TopLabel = styled.h2`
  margin: 0 16px 8px 16px;
  cursor: pointer;
  color: white;
  font-weight: normal;
`;

type BuildingExplorerProps = {
  isShown: boolean;
  sublayers: Sublayer[];
  buildingLevels: (string | number)[];
  onSelect: (item: string) => void;
  onUpdateSublayerVisibility: (sublayer: Sublayer) => void;
};

export function BuildingExplorer({
  isShown,
  sublayers,
  buildingLevels,
  onSelect,
  onUpdateSublayerVisibility
}: BuildingExplorerProps) {
  function toggleGroup(sublayer: Sublayer) {
    sublayer.expanded = !sublayer.expanded;
    onUpdateSublayerVisibility(sublayer);
  }

  function toggleSublayer(sublayer: Sublayer) {
    sublayer.visibility = !sublayer.visibility;
    onUpdateSublayerVisibility(sublayer);
    setChildren(sublayer.sublayers, sublayer.visibility);
  }

  function setChild(sublayer: Sublayer, isShown: boolean) {
    sublayer.visibility = isShown;
    onUpdateSublayerVisibility(sublayer);
    setChildren(sublayer.sublayers, isShown);
  }

  function setChildren(sublayers: Sublayer[] | undefined, isShown: boolean) {
    if (sublayers) {
      for (const sublayer of sublayers) {
        setChild(sublayer, isShown);
      }
    }
  }

  function renderSublayers(sublayers: Sublayer[]) {
    return sublayers.map((sublayer) => {
      const childLayers = sublayer.sublayers || [];
      let icon = faCircle;
      let size = 'xs';
      if (sublayer.sublayers) {
        size = 'lg';
        if (sublayer.expanded) {
          icon = faAngleDown;
        } else {
          icon = faAngleRight;
        }
      }
      return (
        <CheckboxContainer key={sublayer.id}>
          <CheckboxOption>
            <CollapseContainer>
              <FontAwesomeIcon
                icon={icon as IconProp}
                onClick={() => toggleGroup(sublayer)}
                size={size as SizeProp}
              />
            </CollapseContainer>
            <label>
              <Checkbox
                id={`CheckBox${sublayer.id}`}
                value={sublayer.visibility}
                checked={sublayer.visibility}
                onChange={() => toggleSublayer(sublayer)}
              />
              <CheckboxSpan>{sublayer.name}</CheckboxSpan>
            </label>
          </CheckboxOption>
          {sublayer.expanded ? renderSublayers(childLayers) : null}
        </CheckboxContainer>
      );
    });
  }

  return (
    <BuildingExplorerContainer isShown={isShown}>
      <TopLabel>Building Explorer</TopLabel>
      <Label>Select building level:</Label>
      <DropDown items={buildingLevels} onSelect={onSelect} />
      {isShown ? (
        <BuildingExplorerSublayers>{renderSublayers(sublayers)}</BuildingExplorerSublayers>
      ) : null}
    </BuildingExplorerContainer>
  );
}
