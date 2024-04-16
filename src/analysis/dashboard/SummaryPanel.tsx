import {
  Badge, Box, Button, Card, Center, Text, Title, Container, Flex, Group, Popover,
} from '@mantine/core';
import React, { useEffect, useMemo, useState } from 'react';
import { IconCodePlus, IconTable } from '@tabler/icons-react';
import { DateRangePicker, DateRangePickerValue } from '@mantine/dates';
import { VegaLite } from 'react-vega';
import { useDisclosure, useResizeObserver } from '@mantine/hooks';
import { ParticipantData } from '../../storage/types';
import { download, DownloadTidy } from '../../components/DownloadTidy';
import { StudyConfig } from '../../parser/types';
import { isStudyCompleted, isWithinRange } from '../utils';

export function SummaryPanel(props: { studyId: string; allParticipants: ParticipantData[]; config: StudyConfig }) {
  const {
    studyId, allParticipants, config,
  } = props;
  const [openDownload, { open, close }] = useDisclosure(false);
  const [ref, dms] = useResizeObserver();
  const completionTimes = allParticipants
    .filter((d) => isStudyCompleted(d))
    .map((d) => Math.max(...Object.values(d.answers).map((ans) => ans.endTime)));
  const [rangeTime, setRangeTime] = useState<DateRangePickerValue>([
    new Date(new Date(Math.min(...(completionTimes.length > 0 ? completionTimes : [new Date().getTime()]))).setHours(0, 0, 0, 0)),
    new Date(new Date(Math.max(...(completionTimes.length > 0 ? completionTimes : [new Date().getTime()]))).setHours(24, 0, 0, 0)),
  ]);

  const [completedParticipants, setCompletedParticipants] = useState<ParticipantData[]>([]);
  const [inProgressParticipants, setInProgressParticipants] = useState<ParticipantData[]>([]);

  useEffect(() => {
    if (allParticipants.length > 0 && allParticipants[0].sequence.components) {
      const inRangeData = allParticipants.filter((d) => isWithinRange(d.answers, rangeTime));

      const completedData: ParticipantData[] = [];
      const inProgressData: ParticipantData[] = [];

      inRangeData.forEach((d) => {
        if (isStudyCompleted(d)) {
          completedData.push(d);
        } else {
          inProgressData.push(d);
        }
      });

      setCompletedParticipants(completedData);
      setInProgressParticipants(inProgressData);
    }
  }, [allParticipants, rangeTime]);

  const completedStatsData = useMemo(() => {
    if (completedParticipants.length > 0) {
      return [
        { Date: rangeTime[0]?.getTime(), Participants: 0 },
        ...completedParticipants
          .map((participant) => Math.max(
            ...Object.values(participant.answers).map((ans) => ans.endTime).flat(),
          ))
          .sort((a, b) => a - b)
          .map((time, idx) => ({
            Date: time,
            Participants: idx,
          })),
        { Date: rangeTime[1]?.getTime(), Participants: completedParticipants.length },
      ];
    }

    return [];
  }, [completedParticipants, rangeTime]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spec: any = useMemo(() => ({
    width: dms.width - 40 - 8, // width - card padding - vega padding
    height: 200,
    mark: {
      type: 'line',
      interpolate: 'step-before',
    },
    encoding: {
      x: { field: 'Date', type: 'temporal', scale: { domain: [rangeTime[0]?.getTime(), rangeTime[1]?.getTime()] } },
      y: { field: 'Participants', type: 'quantitative' },
    },
    data: { values: completedStatsData },
  }), [dms, completedStatsData]);

  const [jsonOpened, { close: closeJson, open: openJson }] = useDisclosure(false);
  const [csvOpened, { close: closeCsv, open: openCsv }] = useDisclosure(false);

  return (
    <Container>
      <Card ref={ref} p="lg" shadow="md" withBorder>
        <Flex align="center" mb={16} justify="space-between">
          <Flex direction="column">
            <Title order={5} mb={4}>{studyId}</Title>
            <Flex direction="row" wrap="nowrap" gap="xs" align="center" mb={4}>
              <Badge size="sm" color="orange">
                Total:&nbsp;
                {inProgressParticipants.length + completedParticipants.length}
              </Badge>
              <Badge size="sm" color="green">
                Completed:&nbsp;
                {completedParticipants.length}
              </Badge>
              <Badge size="sm" color="cyan">
                In Progress:&nbsp;
                {inProgressParticipants.length}
              </Badge>
            </Flex>
          </Flex>
          <Group>
            <Popover opened={jsonOpened}>
              <Popover.Target>
                <Button
                  disabled={allParticipants.length === 0}
                  onClick={() => {
                    download(JSON.stringify(allParticipants, null, 2), `${studyId}_all.json`);
                  }}
                  onMouseEnter={openJson}
                  onMouseLeave={closeJson}
                  px={4}
                >
                  <IconCodePlus />
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                <Text>Download all participants data as JSON</Text>
              </Popover.Dropdown>
            </Popover>

            <Popover opened={csvOpened}>
              <Popover.Target>
                <Button
                  disabled={allParticipants.length === 0}
                  onClick={open}
                  onMouseEnter={openCsv}
                  onMouseLeave={closeCsv}
                  px={4}
                >
                  <IconTable />
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                <Text>Download all participants data as a tidy CSV</Text>
              </Popover.Dropdown>
            </Popover>
          </Group>
        </Flex>

        <DateRangePicker
          label={<Text>Time Filter:</Text>}
          placeholder="Pick dates range"
          value={rangeTime}
          onChange={setRangeTime}
        />

        {completedStatsData.length > 0
          ? (
            <>
              <Text mt={16}>Finished Participants</Text>
              <VegaLite spec={spec} actions={false} />
            </>
          )
          : (
            <Box h={293.4}>
              <Center style={{ height: '100%' }}>
                <Text>Not enough participants for chart</Text>
              </Center>
            </Box>
          )}
      </Card>

      <DownloadTidy
        opened={openDownload}
        close={close}
        filename={`${studyId}_all_tidy.csv`}
        studyConfig={config}
        data={allParticipants}
      />
    </Container>
  );
}
